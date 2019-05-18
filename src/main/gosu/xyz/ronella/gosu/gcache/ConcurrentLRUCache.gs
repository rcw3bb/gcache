package xyz.ronella.gosu.gcache

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

  public construct(code: String, maxSize : int, lossless : boolean
      , evictLogic : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>>) {
    this._maxSize = maxSize
    this._lossless = lossless
    this._code = code
    this._cache = new ConcurrentHashMap<TYPE_KEY, TYPE_VALUE>(this._maxSize)
    this._fifo = new ConcurrentLinkedQueue<TYPE_KEY>()
    this._evictLogic = evictLogic
  }

  public construct(maxSize : int, lossless : boolean, evictLogic : BiConsumer<String,Map.Entry<TYPE_KEY, TYPE_VALUE>>) {
    this("default", maxSize, lossless, evictLogic)
  }

  public construct(maxSize : int, evictLogic : BiConsumer<String,Map.Entry<TYPE_KEY, TYPE_VALUE>>) {
    this(maxSize, false, evictLogic)
  }

  public construct(maxSize : int, lossless : boolean) {
    this(maxSize, lossless, \___key, ___value -> {})
  }

  public construct(maxSize : int) {
    this(maxSize, false, \ ___key, ___value -> {})
  }

  override public function put(key : TYPE_KEY, value : TYPE_VALUE) : TYPE_VALUE {
    _fifo.remove(key)
    var fifoSize = _fifo.size()
    var _fifoList : List<TYPE_KEY>

    var fifoList = \ ___idx : int -> {
      _fifoList = _fifoList?:_fifo.toList()
      return _fifoList.get(___idx)
    }

    while (fifoSize >= _maxSize) {
      using (LOCK_INSTANCE) {
        var oldestKey = this._lossless ? fifoList(fifoSize - 1) : _fifo.poll()
        if (null != oldestKey) {
          _evictLogic.accept(_code, new AbstractMap.SimpleEntry<TYPE_KEY, TYPE_VALUE>(oldestKey, _cache.get(oldestKey)))
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
      return _cache.remove(key)
    }
  }

  override function clear() {
    using (LOCK_INSTANCE) {
      _cache.clear()
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
    return this == o
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

  override property get Empty() : boolean {
    return this.size()==0
  }

  override function containsKey(key : Object) : boolean {
    return losslessLossyLogics(\-> _fifo.contains(key), \-> _cache.containsKey(key))
  }

  override function containsValue(value : Object) : boolean {
    return losslessLossyLogics(\-> values().contains(value), \-> _cache.contains(value))
  }

  private function internalLosslessGet(key : Object) : TYPE_VALUE {
    //TODO: Implement Lossless Logic Here.
    return _cache.get(key)
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