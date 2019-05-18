package xyz.ronella.gosu.gcache

uses gw.api.system.server.Runlevel
uses gw.testharness.RunLevel
uses gw.testharness.TestBase

/**
 *
 * @author Ron Webb
 * @since 2019-05-18
 */
@RunLevel(Runlevel.NONE)
class ConcurrentLRUCacheTest extends TestBase {

  public function testHittingEvictionLogic() {
    var isHit = false

    var cache = new ConcurrentLRUCache<Integer, Integer>(2, \ ___code, ___entry -> {
      isHit=true
    });

    (1..3).each(\ ___idx -> {
      cache.put(___idx, ___idx)
    })

    assertTrue(isHit)
  }

  public function testHittingEvictionLogicCode() {
    var code : String

    var cache = new ConcurrentLRUCache<Integer, Integer>(2, \ ___code, ___entry -> {
      code=___code
    });

    (1..3).each(\ ___idx -> {
      cache.put(___idx, ___idx)
    })

    assertEquals("default", code)
  }

  public function testHittingEvictionLogicEntry() {
    var entry : Map.Entry

    var cache = new ConcurrentLRUCache<Integer, Integer>(2, \ ___code, ___entry -> {
      entry = ___entry
    });

    (1..3).each(\ ___idx -> {
      cache.put(___idx, ___idx)
    })

    assertTrue(entry.Key==1 && entry.Value==1)
  }

  public function testSizeBeyondMaxSizeLossy() {
    var cache = new ConcurrentLRUCache<Integer, Integer>(2);

    (1..3).each(\ ___idx -> {
      cache.put(___idx, ___idx)
    })

    assertEquals(2, cache.size())
  }

  public function testSizeBeyondMaxSizeLossLess() {
    var cache = new ConcurrentLRUCache<Integer, Integer>(2, true);

    (1..3).each(\ ___idx -> {
      cache.put(___idx, ___idx)
    })

    assertEquals(3, cache.size())
  }

  public function testSizeWithinMaxSize() {
    var cache = new ConcurrentLRUCache<Integer, Integer>(2);

    (1..2).each(\ ___idx -> {
      cache.put(___idx, ___idx)
    })

    assertEquals(2, cache.size())
  }

}