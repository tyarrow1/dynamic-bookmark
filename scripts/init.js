// Initial variables
var folder_name = "";       // Records folder name

// Intialize event listeners (to avoid inline-scripts)
document.getElementById("folder_name_submit").onclick = change_folder_name;

chrome.storage.sync.remove(['DYBK_folder_name']);

// Run init() (which can be run multiple times)
init();

function init() {
    // Check to see if the folder has already been set
    chrome.storage.sync.get(['DYBK_folder_name'], function(result) {
        folder_name = result.DYBK_folder_name;

        // For testing purposes
        document.getElementById("demo").innerHTML = folder_name;
        console.log(`Found ${folder_name} folder\n`);
        
        if (folder_name = "undefined") {
            folder_name = "";
            return;
        }
    });
}

function change_folder_name() {
    // Get the folder name and (minimally) verify it
    var new_name = document.getElementById("folder_name_field").value;
    if (new_name == "") {
        return;
    }

    //console.log("New Name: "+new_name+"\n");

    chrome.storage.sync.set({'DYBK_folder_name': new_name}, function(result) {
        // Move existing bookmarks if there is a current folder
        if (folder_name != "") {
            console.log("Bookmarks should be moved\n");
        }

        // Update the folder_name variable (although it will already be done in init())
        folder_name = new_name;

        // Re-init to make the extension open the new folder
        init();
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