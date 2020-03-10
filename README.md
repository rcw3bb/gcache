# GCache

A simple gosu implementation of concurrent LRU Map.

## Public Constructors

| Constructors                                                 |
| ------------------------------------------------------------ |
| **ConcurrentLRUCache&lt;TYPE_KEY, TYPE_VALUE&gt;**(code : String, maxSize : int, evictLogic : BiConsumer&lt;String, Map.Entry&lt;TYPE_KEY, TYPE_VALUE&gt;&gt;) |
| **ConcurrentLRUCache&lt;TYPE_KEY, TYPE_VALUE&gt;**(code : String, maxSize : int, losslessLogic : ILosslessLogic&lt;TYPE_KEY, TYPE_VALUE&gt;) |
| **ConcurrentLRUCache&lt;TYPE_KEY, TYPE_VALUE&gt;**(code : String, maxSize : int) |
| **ConcurrentLRUCache&lt;TYPE_KEY, TYPE_VALUE&gt;**(maxSize : int, evictLogic : BiConsumer&lt;String,Map.Entry&lt;TYPE_KEY, TYPE_VALUE&gt;&gt;) |
| **ConcurrentLRUCache&lt;TYPE_KEY, TYPE_VALUE&gt;**(maxSize : int)  |

#### Constructor Parameters

| Parameter     | Type                                                | Default                                    | Description                                                  |
| ------------- | --------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| code          | String                                              | default                                    | The code that groups the Map.Entry.                          |
| maxSize       | int                                                 |                                            | The maximum key count of a particular code group in memory.  Anything beyond this limit will trigger either the evictLogic or the losslessLogic. |
| evictLogic    | BiConsumer&lt;String, Map.Entry&lt;TYPE_KEY, TYPE_VALUE&gt;&gt; |                                            | A custom eviction logic.                                     |
| losslessLogic | ILosslessLogic&lt;TYPE_KEY, TYPE_VALUE&gt;                | DefaultLosslessLogic&lt;TYPE_KEY, TYPE_VALUE&gt; | An implementation of ILosslessLogic.                         |

## Proprietary Methods

| Method                                                     | Description                          |
| ---------------------------------------------------------- | ------------------------------------ |
| public function memCacheSize() : int                       | Returns the size of cache in memory. |
| public function memCachedKeys() : Set&lt;TYPE_KEY&gt;            | Returns the keys in memory.          |
| public function memCachedValues() : Collection&lt;TYPE_VALUE&gt; | Returns the values in memory.        |

## DefaultLosslessLogic&lt;TYPE_KEY, TYPE_VALUE&gt; Class

An implementation of **ILosslessLogic&lt;TYPE_KEY, TYPE_VALUE&gt;** that only accepts **String as the key** and **Value that must be tag as Serializable**. The work of this class will only start if the **maxSize** key allocated for memory storage was exceeded. If the key counts is beyond the maxSize indicated, all the key entries that are not used will be serialized to the location defined by the environment variable **GCACHE_DIR** or if it is not present to your **&lt;TMP_DIR&gt;\gcache directory**. The extension name of a serialized objects is **ser**.

## Usage

1. Add the following **maven** dependency to your **gosu** project:

   | Property    | Value            |
   |-------------|------------------|
   | Group ID    | xyz.ronella.gosu |
   | Artifact ID | gcache           |
   | Version     | 1.0.1            |

   > Using gradle, this can be added as a dependency entry like the following:
   >
   > ```groovy
   > compile group: 'xyz.ronella.gosu', name: 'gcache', version: '1.0.1'
   > ```
2. On your code, once an instance of **ConcurrentLRUCache** was created, use it like you are using an instance of a Map. 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## [Build](BUILD.md)

## [Changelog](CHANGELOG.md)

## Author

* Ronaldo Webb
