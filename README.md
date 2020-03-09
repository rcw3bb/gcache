# GCache

A simple gosu implementation of concurrent LRU Map.

## Public Constructors

| Constructors                                                 |
| ------------------------------------------------------------ |
| **ConcurrentLRUCache**(code : String, maxSize : int, evictLogic : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>>) |
| **ConcurrentLRUCache**(code : String, maxSize : int, losslessLogic : ILosslessLogic<TYPE_KEY, TYPE_VALUE>) |
| **ConcurrentLRUCache**(code : String, maxSize : int)         |
| **ConcurrentLRUCache**(maxSize : int, evictLogic : BiConsumer<String,Map.Entry<TYPE_KEY, TYPE_VALUE>>) |
| **ConcurrentLRUCache**(maxSize : int)                        |

#### Constructor Parameters

| Parameter     | Type                                                | Default                                    | Description                                                  |
| ------------- | --------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| code          | String                                              | default                                    | The code that groups the Map.Entry.                          |
| maxSize       | int                                                 |                                            | The maximum key count of a particular code group in memory.  Anything beyond this limit will trigger either the evictLogic or the losslessLogic. |
| evictLogic    | BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>> |                                            | A custom eviction logic.                                     |
| losslessLogic | ILosslessLogic<TYPE_KEY, TYPE_VALUE>                | DefaultLosslessLogic<TYPE_KEY, TYPE_VALUE> | An implementation of ILosslessLogic.                         |

## Proprietary Methods

| Method                                                     | Description                          |
| ---------------------------------------------------------- | ------------------------------------ |
| public function memCacheSize() : int                       | Returns the size of cache in memory. |
| public function memCachedKeys() : Set<TYPE_KEY>            | Returns the keys in memory.          |
| public function memCachedValues() : Collection<TYPE_VALUE> | Returns the values in memory.        |

## DefaultLosslessLogic<TYPE_KEY, TYPE_VALUE>

An implementation of **ILosslessLogic<TYPE_KEY, TYPE_VALUE>** that only accepts **String as the key** and **Value that must be tag as Serializable**. The work of this class will only start if the **maxSize** key allocated for memory storage was exceeded. If the key counts is beyond the maxSize indicated, all the key entries that are not used will be serialized to the location defined by the environment variable **GCACHE_DIR** or if it is not present to your **<TMP_DIR>\gcache directory**. The extension name of a serialized objects is **ser**. Knowing this, it is important that during the startup of the application all of the **instance of ConcurrentLRUCache per code must be cleared** *(i.e. calling its clear method)* or **simply empty the location of the GCACHE_DIR or gcache directory**.

## Usage

Once an instance of **ConcurrentLRUCache** was created, use it like you are using an instance of a Map. 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## [Build](BUILD.md)

## [Changelog](CHANGELOG.md)

## Author

* Ronaldo Webb
