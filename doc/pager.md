#Indexed pager service
The indexed pager service is a management component for managing the manner in which data is queried from an [adapter](adapter.md).

## Sample
The following is a simple sample usage:

```javascript
var pager = new IndexedPager();

pager.setState({
	index: 0,
	padLow: 3,
	padHigh: 3,
	pageSize: 10,
	filter: {
		sort: 'column desc'
	},
	resizeMode: pager.RESIZE_MODE.maintain,
	maxPages: 7,
	retryCount: 5,
	retryDelay: 3000,
	existingMode: pager.EXISTING_MODE.drop
})
	.then(onStateSet)
	.catch(function(err) { console.error(err); });

function onStateSet() {
	var pages = pager.pages();
	//pages will contain information and data for all cached and loading pages.
	//Do something with pages (eg. bind the data to view)
}
```

## Accessors
All accessors are exposed as a pair of functions with the following name format: &lt;accessorName&gt;, set&lt;AccessorName&gt;. For example:
`pager.index()` and `pager.setIndex(100)`.

The pager contains the following accessors:

### index
Gets or sets the current index. Setting this will trigger a load to ensure the current state is correct if necesary. This returns a promise which will be resolved once all execution is finished, and which will be notified on every individual load performed during the execution.

### adapter
Gets or sets the adapter to use with the loader. This may be either the name of an adapter defined in `AdapterService.global`, or a valid adapter object. When this is set, all cached data will be cleared, all loads cancelled and index will be set to null.

### pad
A convenience accessor. Gets the minimum value between padLow and padHigh. When set, sets padLow and padHigh to the supplied value.

### padLow
Gets or sets the number of pages to automatically load below the current index. This will ensure there are pages loaded right next to the current, and can be accessed instantly if a user increments or decrements their current page.

### padHigh
Gets or sets the number of pages to automatically load above the current index. This will ensure there are pages loaded right next to the current, and can be accessed instantly if a user increments or decrements their current page.

### countMode
Gets or sets the manner in which to determine the count. This can be one of the following:
* none - When requested, count should always return null.
* adapter - When requested, count should be loaded using the adapter.
* fixed - The count value will be static, and may be set using the `updateCount(value)` function.
* detect - When a page with an index higher than count is loaded, count will be updated to that index. With this mode, count may also be updated by calling the `updateCount(value)` function.

### filter
Gets or sets the filter to pass to the adapter when making queries. No checks are performed on this value, and it will be passed as it to the adapter.

### pageSize
Gets or sets the expected number of entries in each page. If resizeMode is set to "clear", the data will be cleared when this value is changed. If resizeMode is set to "maintain", the page arrays will be manipulated in order to preserve the existing in memory records.

### state
Gets or sets the pager state object. This is a great way to bulk update properties, and the only way to set padLow, padHigh and setIndex all at once while only performing a single execution. The expected object contains all of the accessor names with their associated values. Calling setState will inspect these same names, and call the appropriate setters if the supplied state object contains the relevant property.

### resizeMode
Gets or sets how to behave when the pageSize is changed. This may have one of the following 2 values.
* maintain - The pager will attempt to maintain existing cache entries when resizing.
* clear - The pager wil remove all existing data when resizing the pages.

### indexMode
Gets or sets whether to allow negative indexes. This may have one of the following 2 values:
* positive - Only allow indexes greater than or equal to 0.
* full - Allow any valid integer as an index.

### maxPages
Gets or sets the maximum number of pages that may be cached. Setting this to lower than the current number of cached pages will cause excess pages to be purged.

### adapterObject
Gets the current adapterObject. This is useful if setAdapter was called with a name, and you require the adapter object associated with that name. If setAdapter was called directly with an adapter, this will return the same as adapter.

### parallel
Gets or sets the maximum number of concurrent loads to process at any point of time in the loader.

### batching
Gets or sets whether to combine contiguous loads into a single load.

### batchMax
Gets or sets the maximum number of records to combine when batching.

### loadMax
Gets or sets the maximum number of items that may be loading at any given moment. If this is set to lower than the current number of loading items, existing loads will be purged.

### loadOverflowMode
Gets or sets what to do when attempting to add a load instruction which will overflow loadMax. This may be one of the following values:
* error - An error should be thrown
* cancel - Existing loads should be cancelled (oldest first) until we are not over the threshold

### retryCount
Gets or sets the number of times to retry a load on failure.

### retryDelay
Gets or sets the amount of time to wait before retrying a load on failure.

### existingMode
Gets or sets what to do when a load is attempted of a value that is already cached. Can be one of the following values:
* replace - The load will be done as normal, and once complete, the cached data will be updated.
* ignore - The load will not be performed by itself, but will be performed if it is part of a batch. The existing cached data will be returned, and if the load is in fact performed, the cache will **not** be updated.
* drop - Drops the load when it is added.

## Functions
The following functions are available on the pager.

### clear()
Clears all data in the pager, and sets the index to null.

### page(index)
Returns information about the given index. Returns the following structure.

```javascript
{
	index: 123,
	data: [1, 2, 3, 4, 5],
	loading: false,
	cancel: function() { }
}
```

Will return null if the index is not cached or loading.

### pages()
Similar to the `page(index)` function, except that it returns information for all indexes currently being managed by the pager.

### remove(index)
Uncaches a record from the cache if it is currently cached.

### count()
Returns a promise which will be resolved by the current count. The value returned here depends on what `countMode` is set to.

### updateCount(cnt)
Updates the count which will be used when `countMode` is set to "fixed" or "detect".

### seed(data)
Clears all current data, manually loads the supplied array from index 0 into the cache, and sets index to 0. This can be used to supply initial data to the pager.