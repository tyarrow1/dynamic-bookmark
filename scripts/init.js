//console.log(document.getElementById("demo"));

document.getElementById("demo").innerHTML = "Haha syke";
console.log("Hello World 2\n");
//print("Hello World 2\n");

var folder_name = "";

init();

function init() {
    chrome.storage.sync.get(['DYBK-folder-name'], function(result) {
        document.getElementById("demo").innerHTML = result.key;
        folder_name = result.key;
        if (folder_name = "undefined") {
            
        }
    });
}



// chrome.bookmarks.search({
//     'title': "test bookmark"
// }, function (results) {
// if (results.length == 0) {
//     //console.log("Could not find it");
//     document.getElementById("demo").innerHTML = "Could not find it";
//     chrome.bookmarks.create({
//         "title": "test bookmark"
//     }, function (newBookmark) {
//         //console.log("Created " + newBookmark.title);
//         document.getElementById("demo").innerHTML = "Created " + newBookmark.title;
//     });
// } else {
//     //console.log("Found " + results[0].title);
//     document.getElementById("demo").innerHTML = "Found " + results[0].title;
// }
// });