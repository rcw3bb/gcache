package xyz.ronella.gosu.gcache

uses xyz.ronella.gosu.gcache.impl.DefaultLosslessLogic

uses java.util.concurrent.locks.ReentrantLock
uses java.util.function.BiConsumer
uses java.util.concurrent.ConcurrentLinkedQueue
uses java.util.concurrent.ConcurrentHashMap
uses java.util.function.Supplier
uses java.util.stream.Collectors

/**
 *
 *
 * @param <TYPE_KEY>
 * @param <TYPE_VALUE>
 *
 * @author Ron Webb
 * @since 2018-05-18
 */
class ConcurrentLRUCache<TYPE_KEY, TYPE_VALUE> implements Map<TYPE_KEY, TYPE_VALUE> {

  private var _maxSize : int
  private var _cache : ConcurrentHashMap<TYPE_KEY, TYPE_VALUE>
  private var _fifo : ConcurrentLinkedQueue<TYPE_KEY>
  private var _nullValues : Set<TYPE_KEY>
  private var _evictLogic : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>>
  private var _lossless : boolean
  private var _code : String
  final var LOCK_INSTANCE = new ReentrantLock()
  private var _losslessLogic : ILosslessLogic<TYPE_KEY, TYPE_VALUE>
  private static final var DEFAULT_CODE : String = "default"

  public construct(code: String, maxSize : int, evictLogic : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>>) {
    this._maxSize = maxSize
    this._lossless = false
    this._code = code?:DEFAULT_CODE
    this._cache = new ConcurrentHashMap<TYPE_KEY, TYPE_VALUE>(this._maxSize)
    this._fifo = new ConcurrentLinkedQueue<TYPE_KEY>()
    this._evictLogic = evictLogic
    this._nullValues = new HashSet<TYPE_KEY>()
  }

  public construct(code : String, maxSize : int, losslessLogic : ILosslessLogic<TYPE_KEY, TYPE_VALUE>) {
    this(maxSize)
    this._code = code?:DEFAULT_CODE
    this._lossless = true

    if (null==losslessLogic) {
      throw new MissingLosslessLogicException()
    }

    this._losslessLogic = losslessLogic
    this._evictLogic = this._losslessLogic.evictLogic()
    clear()
  }

  public construct(code : String, maxSize : int) {
    this(code, maxSize, new DefaultLosslessLogic<TYPE_VALUE, TYPE_VALUE>() as ILosslessLogic<TYPE_KEY, TYPE_VALUE>)
  }

  public construct(maxSize : int, evictLogic : BiConsumer<String,Map.Entry<TYPE_KEY, TYPE_VALUE>>) {
    this(DEFAULT_CODE, maxSize, evictLogic)
  }

  public construct(maxSize : int) {
    this(maxSize, \ ___key, ___value -> {})
  }

  private function internalLosslessGet(key : Object) : TYPE_VALUE {
    var reloadKey = \-> {
      var value = _losslessLogic.getLogic().apply(_code, key)
      if (null!=value) {
        this.put(key as TYPE_KEY, value)
      }
      return value
    }
    return _cache.get(key)?:reloadKey()
  }

  override public function put(key : TYPE_KEY, value : TYPE_VALUE) : TYPE_VALUE {
    losslessLossyLogics(\-> {
      _losslessLogic.putValidationLogic().accept(_code, new AbstractMap.SimpleEntry<TYPE_KEY, TYPE_VALUE>(key, value))
      return null
    }, \-> null)

    var returnValue : TYPE_VALUE

    _nullValues.remove(key)
    _fifo.remove(key)

    if (value==null) {
      _cache.remove(key)
      _nullValues.add(key)
      returnValue = value
    }
    else {
      while (_fifo.size() >= _maxSize) {
        using (LOCK_INSTANCE) {
          var oldestKey = _fifo.poll()
          if (null != oldestKey) {
            var oldestValue = _cache.get(oldestKey)
            if (null != oldestValue) {
              var entryToRemove = new AbstractMap.SimpleEntry<TYPE_KEY, TYPE_VALUE>(oldestKey, oldestValue)
              _evictLogic.accept(_code, entryToRemove)
              _cache.remove(oldestKey)
            }
          }
        }
      }
      returnValue = _cache.put(key, value)
    }

    _fifo.add(key)

    return returnValue
  }

  override function remove(key : Object) : TYPE_VALUE {
    using (LOCK_INSTANCE) {
      _fifo.remove(key)

      if (!_nullValues.remove(key)) {
        var cacheRemove = \-> _cache.remove(key)
        return losslessLossyLogics(\-> cacheRemove()?:_losslessLogic.removeLogic().apply(_code, key), cacheRemove)
      }

      return null
    }
  }

  override function clear() {
    using (LOCK_INSTANCE) {
      var cacheClear = \-> {
        _cache.clear()
        return null
      }
      losslessLossyLogics(\-> {
        cacheClear()
        _losslessLogic.clearLogic().accept(_code)
        return null
      }, cacheClear)
      _nullValues.clear()
      _fifo.clear()
    }
  }

  override function keySet() : Set<TYPE_KEY> {

    return losslessLossyLogics(\-> {

      var ___keys = _cache.Keys?.map<TYPE_KEY>(\ ___key -> (___key as TYPE_KEY))?.toSet()
      var keysLoader = _losslessLogic.getKeysByCode()

      if (keysLoader!=null) {

        if (___keys==null) {
          ___keys = keysLoader.apply(_code)
        }
        else {
          ___keys.addAll(keysLoader.apply(_code))
        }
      }

      ___keys.addAll(_nullValues)

      return ___keys

    }, \-> {
      var ___keys = _cache.keySet()
      ___keys.addAll(_nullValues)
      return ___keys
    })
  }

  override function values() : Collection<TYPE_VALUE> {
    return losslessLossyLogics(\-> keySet().parallelStream().map<TYPE_VALUE>(\___key -> internalGet(___key))
        .collect(Collectors.toList<TYPE_VALUE>()), \-> _cache.Values)
  }

  override function entrySet() : Set<Entry<TYPE_KEY, TYPE_VALUE>> {
    return losslessLossyLogics(\-> keySet().parallelStream()
        .map<Entry<TYPE_KEY, TYPE_VALUE>>(\___key -> new AbstractMap.SimpleEntry<TYPE_KEY, TYPE_VALUE>(___key, internalGet(___key)))
          .collect(Collectors.toSet<Entry<TYPE_KEY, TYPE_VALUE>>())
        , \-> {
          var _nullEntrySet = _nullValues.stream().map<Entry<TYPE_KEY, TYPE_VALUE>>(
              \ ___key -> new AbstractMap.SimpleEntry<TYPE_KEY, TYPE_VALUE>(___key, null as TYPE_VALUE)
          ).collect(Collectors.toSet<Entry<TYPE_KEY, TYPE_VALUE>>())

          _nullEntrySet.addAll(_cache.entrySet())
          return _nullEntrySet
        }
    )
  }

  override function equals(o : Object) : boolean {
    return Objects.equals(this, o)
  }

  override function hashCode() : int {
    return _cache.hashCode() ^ _fifo.hashCode()
  }

  override function putAll(map : Map<TYPE_KEY, TYPE_VALUE>) {
    map.eachKeyAndValue(\___key, ___val -> this.put(___key, ___val))
  }

  private function losslessLossyLogics<TYPE_RETURN>(lossless : Supplier<TYPE_RETURN>, lossy : Supplier<TYPE_RETURN>) : TYPE_RETURN {
    return _lossless ? lossless.get() : lossy.get()
  }

  override function size() : int {
    return losslessLossyLogics(\-> keySet().size(), \-> _cache.size())
  }

  public function memCacheSize() : int {
    return _cache.size()
  }

  public function memCachedKeys() : Set<TYPE_KEY> {
    return _cache.Keys
  }

  public function memCachedValues() : Collection<TYPE_VALUE> {
    return _cache.Values
  }

  override property get Empty() : boolean {
    return this.size()==0
  }

  override function containsKey(key : Object) : boolean {
    return losslessLossyLogics(\-> keySet().contains(key), \-> _cache.containsKey(key))
  }

  override function containsValue(value : Object) : boolean {
    return losslessLossyLogics(\-> values().contains(value), \-> _cache.contains(value))
  }

  private function internalGet(key : Object) : TYPE_VALUE {
    return losslessLossyLogics(\-> internalLosslessGet(key), \-> _cache.get(key))
  }

  override public function get(key : Object) : TYPE_VALUE {

    var value : TYPE_VALUE

    var updateFifo = \-> {
      _fifo.remove(key)
      _fifo.add(key as TYPE_KEY)
    }

    if (_nullValues.contains(key)) {
      updateFifo()
      value = null
    }
    else {
      value = internalGet(key)
      if (null != value) {
        updateFifo()
      }
    }

    return value
  }
}