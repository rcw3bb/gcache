package xyz.ronella.gosu.gcache

uses java.util.function.BiConsumer
uses java.util.function.BiFunction
uses java.util.function.Consumer
uses java.util.function.Function

/**
 * @author Ron Webb
 * @since 2019-05-18
 */
interface ILosslessLogic<TYPE_KEY, TYPE_VALUE> {

  function evictLogic() : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>>

  function getLogic() : BiFunction<String, Object, TYPE_VALUE>

  function removeLogic() : BiFunction<String, Object, TYPE_VALUE>

  function putValidationLogic() : BiConsumer<String, Map.Entry<TYPE_KEY, TYPE_VALUE>>

  function getKeysByCode() : Function<String, Set<TYPE_KEY>>

  function clearLogic() : Consumer<String>

}