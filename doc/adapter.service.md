# AdapterService
The adapter service is an [ObjectStorageService](objectstorage.md) customised to manage data adpaters. A data adapter in its simplest form is an object containing a *find* function.

## AdapterService.global
This is a global singleton which can be used to reference adapters by name from the rest of the the application.