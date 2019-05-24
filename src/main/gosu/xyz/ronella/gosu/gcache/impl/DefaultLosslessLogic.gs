package xyz.ronella.gosu.gcache.impl

uses xyz.ronella.gosu.gcache.GCacheException

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
uses java.util.function.Function
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

  protected property get CacheDir() : String {
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

  protected function destinationDir(code: String) : File {
    var destDir = Paths.get(CacheDir, {code}).toFile()
    return destDir
  }

  protected property get SerialExtensionName() : String {
    return "ser"
  }

  protected function actualFile(destDir: File, key: Object) : File {
    return Paths.get(destDir.AbsolutePath, {(key as String) + "." + SerialExtensionName}).toFile()
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
    return \ ___code : String, ___entry : Map.Entry<TYPE_KEY, TYPE_VALUE>-> {
      var validationLogics : List<Consumer<Map.Entry<TYPE_KEY, TYPE_VALUE>>> = {
          \ ___entry1 : Map.Entry<TYPE_KEY, TYPE_VALUE> -> {
            if (null == ___entry1.getKey()) {
              throw new NullPointerException("Key cannot be null")
            }
          },
          \ ___entry1 : Map.Entry<TYPE_KEY, TYPE_VALUE> -> {
            if (null == ___entry1.getValue()) {
              throw new NullPointerException("Value cannot be null")
            }
          },
          \ ___entry1 : Map.Entry<TYPE_KEY, TYPE_VALUE> -> {
            if (!(___entry1.getKey() typeis String)) {
              throw new RuntimeException("Key must be of type String")
            }
          },
          \ ___entry1 : Map.Entry<TYPE_KEY, TYPE_VALUE> -> {
            if (!(___entry1.Value typeis Serializable)) {
              throw new SerializableException("Value must be Serializable")
            }
          }
    }

      validationLogics.parallelStream().forEach(\ ___validation : Consumer<Map.Entry<TYPE_KEY, TYPE_VALUE>> -> {
        ___validation.accept(___entry)
      })
    }
  }



  override function getKeysByCode() : Function<String, Set<TYPE_KEY>> {
    return \ ___code -> {
      var destDir = destinationDir(___code)
      if (!destDir.exists()) {
        return {}
      }

      var keys = destDir.listFiles(\dir, name -> name?.toLowerCase()?.endsWith("." + SerialExtensionName))
          ?.map<String>(\___file -> ___file.Name.substring(0, ___file.Name.length - 4))?.toSet() as Set<TYPE_KEY>

      return keys
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