#Adapters
A data adapter in its simplest form is an object containing a *find* function.

## Required functions
* `find (filter, args)` - This is the only required function, and allows searching through the data source for records matching the supplied filter. 
    * filter will be set by a consumer, and as such is a fully user defined structure which we make no assumptions about. 
    * args is expected to contain 3 properties.
        * skip - The record index to start returning data from.
        * limit - The number of records to retrieve
        * cancel - A promise which will be resolved if the consumer wishes to cancel the search while it is in progress

## Optional functions
* `count (filter, args)` - Returns a promise that will be resolved with the number of record matching the specified filter and args.
	* filter will be set by a consumer, and as such is a fully user defined structure which we make no assumptions about. 
    * args is expected to contain 3 properties.
        * skip - The record index to start returning data from.
        * limit - The number of records to retrieve
        * cancel - A promise which will be resolved if the consumer wishes to cancel the request while it is in progress
* `info ()` - This can be used to return an object indicating the best configuration to use when calling the service. For example, when using the adapter with a pager, when `setAdapter(adapter)` is called, and `info()` exists, it gets called, and the details are used to configure the pager to the most appropriate configuration automatically. The info function should return an object with the following properties:

```javascript
{
	//The maximum number of parallel loads to be performing at any one time.
	parallel: 3,
	//The maximum number of records that should be requested at once.
	max: 50,
	//Whether when the page is resized, the existing cached data can still be used. If this is false, the data will be cleared when changing pageSize
	dynamic: true
}
```