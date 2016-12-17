require('globals'); // necessary to bootstrap tns modules on the new thread
var Contact = require("./contact-model");
var helper = require("./contact-helper");

/* pass debug messages to main thread since web workers do not have console access */
function console_log(msg) { postMessage({ type: 'debug', message: msg }); }
function console_dump(msg) { postMessage({ type: 'dump', message: msg }); }

self.onmessage = function (event) {
  // console_log('message received from main script');
  // console_dump(event.data);
  contactFields = event.data.contactFields;
  
  var keysToFetch = [];  // All Properties that we are using in the Model
  if (contactFields.indexOf('name') > -1) { 
      keysToFetch.push(
          "givenName", "familyName", "middleName", "namePrefix", "nameSuffix", 
          "phoneticGivenName", "phoneticMiddleName", "phoneticFamilyName"
      );
  }

  if (contactFields.indexOf('organization') > -1) { keysToFetch.push("jobTitle", "departmentName", "organizationName"); }
  if (contactFields.indexOf('nickname') > -1) { keysToFetch.push("nickname"); }
  if (contactFields.indexOf('notes') > -1) { keysToFetch.push("notes"); }
  if (contactFields.indexOf('photo') > -1) { keysToFetch.push("imageData", "imageDataAvailable"); }
  if (contactFields.indexOf('phoneNumbers') > -1) { keysToFetch.push("phoneNumbers"); }
  if (contactFields.indexOf('emailAddresses') > -1) { keysToFetch.push("emailAddresses"); }
  if (contactFields.indexOf('postalAddresses') > -1) { keysToFetch.push("postalAddresses"); }
  if (contactFields.indexOf('urlAddresses') > -1) { keysToFetch.push("urlAddresses"); }

  var store = new CNContactStore(),
  error,
  fetch = CNContactFetchRequest.alloc().initWithKeysToFetch(keysToFetch),
  cts = [],
  nativeMutableArray = new NSMutableArray();
  
  fetch.unifyResults = true;
  fetch.predicate = null;
  
  store.enumerateContactsWithFetchRequestErrorUsingBlock(fetch, error, function(c,s){
    nativeMutableArray.addObject(c);
    var contactModel = new Contact();
    contactModel.initializeFromNative(c,contactFields);
    cts.push(contactModel);
  });
  
  if(error) { postMessage({ type: 'error', message: error }); }
  if(cts.length > 0) { postMessage({ type: 'result', message: { data: cts, response: "fetch" }}); }
  else { postMessage({ type: 'result', message: { data: null, response: "fetch" }}); }
}
