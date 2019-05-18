package xyz.ronella.gosu.gcache.impl

uses xyz.ronella.gosu.gcache.ILosslessLogic

uses java.util.function.BiConsumer

/**
 * @author Ron Webb
 * @since 2019-05-18
 */
abstract class AbstractLosslessLogic<TYPE_KEY, TYPE_VALUE> implements ILosslessLogic<TYPE_KEY, TYPE_VALUE> {

  override function putValidationLogic() : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>> {
    return \ ___code, ___entry -> {}
  }

}