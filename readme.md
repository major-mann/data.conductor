#Javascript Data Conductor
Provides tools to make efficient access to remote data sources trivial.

## Main components
At the time of this writing, the following main components are available (with more to come. See [roadmap.md](roadmap.md))

* [AdapterService](doc/adapter.service.md) - Provides a global location to store adapters.
* [IndexedPagerService](#indexed-pager-service) - A service which allows automatic caching and dropping of data according to the currently set index.

##What it does

###IndexedPagerService
The simplest way to describe the behaviour of the pager is in the following image

![Page load, cache and drop on selection change animation](doc/pager.anim.gif)

Above you can see that as the selection changes, the pager loads the desired pages, including a page to the left and to the right of the selected page. 
Additionally the pager ensures the that there are a maximum of 3 pages stored, and drops the page furthest from the current index in order to accomadate newly loaded pages. The pager configuration for the behaviour above is as follows:

```javascript
pager.setAdapter('myAdapter');  //Your adapter or adapter name here, see below
pager.setPageSize(10);          //How many records you want with each page
pager.setMaxPages(3);           //Ensure no more than 3 pages cached
pager.setPadLow(1);             //Load one page below the current index
pager.setPagHigh(1);            //Load one page above the current index
pager.setIndex(0);              //Kick off the loads by setting the initial index
```

###AdapterService
This provides named base storage for [data adapters](doc/adapter.service.md), as well as a global singleton (AdapterService.global) which can be used to store adapters, and later set them by name in components such as the pager.

##Getting Started
In order to get started with this library, 3 steps are required.

1 Download
```
git clone https://github.com/major-mann/data.conductor.git
```
Optionally, you may wish to develop, or view the demo, in which case you should do
```
npm install
```
Once done, launch the demo server and demo in your browser by
```
npm start
```

2 Create an adapter to hook up to your data source. Here is some sample code to get you going.

```javascript
var adapter = {
    //In both cases the argument structure is the same
    //filter will be fully defined by the you (for example by calling setFilter on the pager)
    //args contains the following:
    //  args.skip - The data index to start reading at
    //  args.limit - The number of records to retrieve
    //  args.cancel - A promise that will be resolved if the consumer wishes to cancel the call
    find: function (filter, args) {
        //We will be returning a promise to be resolved once we have the requested data
        var deferred = $q.defer(),
            filt = {
                where: filter,
                skip: args.skip,
                limit: args.limit
            };

        //This would usually be some kind of remote service call (eg. using http)
        mydb.find(filt, function(err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                //Note: We expect that data will be an array.
                //  If there is no data at the specified index, null should be returned.
                //  If there are not enough records in the dataset to fulfil the request,
                //      as many records as possible should be returned.
                deferred.resolve(data);
            }
        });

        return deferred.promise;
    },
    //Note: this is optional, but is often quite easily implemented, and quite useful to consumers.
    count: function (filter, args) {
        //We will be returning a promise to be resolved once we have the count
        var deferred = $q.defer(),
            filt = {
                where: filter,
                skip: args.skip,
                limit: args.limit
            };

        //This would usually be some kind of remote service call (eg. using http)
        mydb.count(filt, function(err, count) {
            if (err) {
                deferred.reject(err);
            } else {
                //We expect a number for count
                deferred.resolve(count);
            }
        });

        return deferred.promise;
    }
}
```
Note: You may optionally add this adapter to the AdapterService singleton, and in future refer to it by name.
For example:

```javascript
var adapter = { };
AdapterService.global.add('myAdapterName', adapter);

//The pager may be then referenced by name
pager.setAdapter('myAdapterName');
//Or, you may choose to use the object directly, without involving the global AdapterService.
pager.setAdapter(adapter);
```

3 Once you have an adapter, you may create a pager, and set it's adapter to the previously created adapter.

```javascript
var pager = new IndexedPager();
pager.setAdapter(myAdapter);
//Set any other options here (See the docs for more info)
pager.setIndex().then(function () {
    var pages = pager.pages(),
        i, j;

    for (i = 0; i < pages.length; i++) {
        console.log('Index: ' + pages[i].index);
        console.log('Loading: ' + pages[i].loading);
        for (j = 0; j < pages[i].data.length; j++) {
            console.log('Page ' + i + ', Item ' + j);
        }
        //Note: Each page has a cancel function. If called while loading, the load will be cancelled.
    }
});
```
To view the full capabilities, launch the server by doing `npm install && npm start`

For more information, see the [documentation](doc/index.md).