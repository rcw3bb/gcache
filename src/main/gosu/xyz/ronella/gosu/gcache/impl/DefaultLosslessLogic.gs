package xyz.ronella.gosu.gcache.impl

uses xyz.ronella.gosu.gcache.GCacheException
uses xyz.ronella.gosu.gcache.ILosslessLogic

uses javax.xml.ws.spi.Invoker
uses java.io.File
uses java.io.FileInputStream
uses java.io.FileOutputStream
uses java.io.NotSerializableException
uses java.io.ObjectInputStream
uses java.io.ObjectOutputStream
uses java.io.Serializable
uses java.nio.file.FileSystems
uses java.nio.file.Paths
uses java.util.function.BiConsumer
uses java.util.function.BiFunction
uses java.util.function.Consumer
uses java.util.function.Supplier

/**
 * @author Ron Webb
 * @since 2019-05-18
 */
class DefaultLosslessLogic<TYPE_KEY, TYPE_VALUE> extends AbstractLosslessLogic<TYPE_KEY, TYPE_VALUE> {

  public static class SerializableException extends GCacheException {
    construct(message : String) {
      super(message)
    }
  }

  protected var _cacheDir : String

  public construct() {
    this._cacheDir = getCacheDir()
  }

  private function getCacheDir() : String {
    var path = Optional.ofNullable(System.getenv("GCACHE_DIR")).orElseGet(\-> {
      var tmpFolder = "tmp"
      var gcacheFolder = "gcache"
      return Paths.get(FileSystems.getDefault().getPath(tmpFolder, {}).toAbsolutePath().getRoot().toString(),
          {tmpFolder, gcacheFolder}).toString()
    })

    var destDir = Paths.get(path, {}).toFile()

    if (!destDir.exists()) {
      destDir.mkdirs()
    }

    return path
  }

  private function destinationDir(code: String) : File {
    var destDir = Paths.get(_cacheDir, {code}).toFile()
    return destDir
  }

  private function actualFile(destDir: File, key: Object) : File {
    return Paths.get(destDir.AbsolutePath, {(key as String) + ".ser"}).toFile()
  }

  override function evictLogic() : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>> {
    return \ ___code, ___entry -> {
      var destDir = destinationDir(___code)

      if (!destDir.exists()) {
        destDir.mkdirs()
      }

      var objFile=actualFile(destDir, ___entry.getKey())?.AbsolutePath
      var obj = ___entry.Value

      if (obj typeis Serializable) {
        try {
          using(var fileOut = new FileOutputStream(objFile)
              ,var out = new ObjectOutputStream(fileOut)) {
            out.writeObject(obj)
          }
        }
        catch (nse : NotSerializableException) {
          var objFileInstance = new File(objFile)
          if (objFileInstance.exists()) {
            objFileInstance.delete()
          }
          throw nse
        }
      }
    }
  }

  override function getLogic() : BiFunction<String, Object, TYPE_VALUE> {
    return \ ___code, ___key -> {
      var destDir = destinationDir(___code)
      var objFile=actualFile(destDir, ___key)

      if (objFile.exists()) {
        try {
          var obj : TYPE_VALUE
          using (var fileIn = new FileInputStream(objFile)
              , var out = new ObjectInputStream(fileIn)) {
            obj = out.readObject() as TYPE_VALUE
          }
          return obj
        }
        finally {
          objFile.delete()
        }
      }
      return null
    }
  }

  override function removeLogic() : BiFunction<String, Object, TYPE_VALUE> {
    return \ ___code, ___key -> getLogic().apply(___code, ___key)
  }

  override function putValidationLogic() : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>> {
    return \ ___code, ___entry -> {
      var validationLogics : List<Supplier<Boolean>> = {
         \->  ___entry.getKey() typeis Serializable, \-> ___entry.getValue() typeis Serializable
      }

      validationLogics.parallelStream().filter(\ ___validation : Supplier<Boolean> -> !___validation.get()).findAny()
          .ifPresent(\ ___validation -> {
            throw new SerializableException("Both Key and Value must be both java.io.Serializable")
      })
    }
  }

  override function clearLogic() : Consumer<String> {
    return \ ___code -> {
      var destDir = destinationDir(___code)

      if (destDir.exists()) {
        destDir.deleteRecursively()
      }
    }
  }
}