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
  private var _evictLogic : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>>
  private var _lossless : boolean
  private var _code : String
  final var LOCK_INSTANCE = new ReentrantLock()
  private var _losslessLogic : ILosslessLogic<TYPE_KEY, TYPE_VALUE>

  public construct(code: String, maxSize : int, evictLogic : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>>) {
    this._maxSize = maxSize
    this._lossless = false
    this._code = code
    this._cache = new ConcurrentHashMap<TYPE_KEY, TYPE_VALUE>(this._maxSize)
    this._fifo = new ConcurrentLinkedQueue<TYPE_KEY>()
    this._evictLogic = evictLogic
  }

  public construct(code : String, maxSize : int, losslessLogic : ILosslessLogic<TYPE_KEY, TYPE_VALUE>) {
    this(maxSize)
    this._code = code
    this._lossless = true

    if (null==losslessLogic) {
      throw new MissingLosslessLogicException()
    }

    this._losslessLogic = losslessLogic
    this._evictLogic = this._losslessLogic.evictLogic()
    clear()

  }

  public construct(code : String, maxSize : int) {
    this(code, maxSize, new DefaultLosslessLogic<TYPE_KEY, TYPE_VALUE>())
  }

  public construct(maxSize : int, evictLogic : BiConsumer<String,Map.Entry<TYPE_KEY, TYPE_VALUE>>) {
    this("default", maxSize, evictLogic)
  }

  public construct(maxSize : int) {
    this(maxSize, \ ___key, ___value -> {})
  }

  private function internalLosslessGet(key : Object) : TYPE_VALUE {
    var reloadKey = \-> {
      var value = _losslessLogic.getLogic().apply(_code, key)
      this.put(key as TYPE_KEY, value)
      return value
    }
    return _cache.get(key)?:reloadKey()
  }

  override public function put(key : TYPE_KEY, value : TYPE_VALUE) : TYPE_VALUE {
    losslessLossyLogics(\-> {
      _losslessLogic.putValidationLogic().accept(_code, new AbstractMap.SimpleEntry<TYPE_KEY, TYPE_VALUE>(key, value))
      return null
    }, \-> null)

    _fifo.remove(key)
    var fifoSize = _fifo.size()
    var fifoList = _fifo.toList()

    while (fifoSize >= _maxSize) {
      using (LOCK_INSTANCE) {
        var oldestKey = this._lossless ? fifoList.remove(0) : _fifo.poll()
        if (null != oldestKey) {
          var entryToRemove = new AbstractMap.SimpleEntry<TYPE_KEY, TYPE_VALUE>(oldestKey, _cache.get(oldestKey))
          _evictLogic.accept(_code, entryToRemove)
          _cache.remove(oldestKey)
        }
        fifoSize--
      }
    }
    _fifo.add(key)

    return _cache.put(key, value)
  }

  override function remove(key : Object) : TYPE_VALUE {
    using (LOCK_INSTANCE) {
      _fifo.remove(key)
      var cacheRemove = \-> _cache.remove(key)
      return losslessLossyLogics(\-> cacheRemove()?:_losslessLogic.removeLogic().apply(_code, key), cacheRemove)
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

      _fifo.clear()
    }
  }

  override function keySet() : Set<TYPE_KEY> {
    return losslessLossyLogics(\-> _fifo.parallelStream().collect(Collectors.toSet<TYPE_KEY>()), \-> _cache.keySet())
  }

  override function values() : Collection<TYPE_VALUE> {
    return losslessLossyLogics(\-> _fifo.parallelStream().map<TYPE_VALUE>(\___key -> internalGet(___key))
        .collect(Collectors.toList<TYPE_VALUE>()), \-> _cache.Values)
  }

  override function entrySet() : Set<Entry<TYPE_KEY, TYPE_VALUE>> {
    return losslessLossyLogics(\-> _fifo.parallelStream()
        .map<Entry<TYPE_KEY, TYPE_VALUE>>(\___key ->
            new AbstractMap.SimpleEntry<TYPE_KEY, TYPE_VALUE>(___key, internalGet(___key))
        ).collect(Collectors.toSet<Entry<TYPE_KEY, TYPE_VALUE>>()), \-> _cache.entrySet())
  }

  override function equals(o : Object) : boolean {
    return this === o
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
    return losslessLossyLogics(\-> _fifo.size(), \-> _cache.size())
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
    return losslessLossyLogics(\-> _fifo.contains(key), \-> _cache.containsKey(key))
  }

  override function containsValue(value : Object) : boolean {
    return losslessLossyLogics(\-> values().contains(value), \-> _cache.contains(value))
  }

  private function internalGet(key : Object) : TYPE_VALUE {
    return losslessLossyLogics(\-> internalLosslessGet(key), \-> _cache.get(key))
  }

  override public function get(key : Object) : TYPE_VALUE {
    var value = internalGet(key)

    if (null != value) {
      _fifo.remove(key)
      _fifo.add(key as TYPE_KEY)
    }

    return value
  }
}