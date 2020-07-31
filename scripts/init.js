// Initial variables
var folder_name = "";       // Records folder name
var bookmark_pairs = [];
var bookmark_mode = false;
var parent_folder = null;

// Intialize event listeners (to avoid inline-scripts)
document.getElementById("folder_name_submit").onclick = change_folder_name;

// Run init() (which can be run multiple times)
init();

function init() {
    // Check to see if the folder has already been set
    chrome.storage.sync.get(['DYBK_folder_name'], function (result) {
        folder_name = result.DYBK_folder_name;

        // For testing purposes
        document.getElementById("demo").innerHTML = folder_name;
        print(`Found ${folder_name} in storage\n`)

        if (typeof(folder_name) === "undefined") {
            folder_name = "";
            bookmark_mode = false;
            return;
        }

        search_create_folder();
    });
}

function search_create_folder() {
    var otherBookmarksID = 0;
    chrome.bookmarks.getTree(function (tree) {
        otherBookmarksID = tree[0].children[1].id;

        // Check if the bookmark folder has been created
        chrome.bookmarks.search({
            'title': folder_name
        }, function (results) {
            if (results.length === 0) {
                // create the bookmark folder
                print("Didn't find anything");
                chrome.bookmarks.create({
                    'parentId': otherBookmarksID,
                    'title': folder_name
                }, function(result) {
                    parent_folder = result;
                    print("Created "+parent_folder.title+" bookmark folder");
                    populate_bookmarks();
                });
            } else {
                // use the bookmark folder
                print("Found " + results[0].title + " bookmark folder");
                parent_folder = results[0];
                populate_bookmarks();
            }
        });
    });
}

function populate_bookmarks() {
    chrome.bookmarks.getChildren(parent_folder.id,function(results) {
        if (typeof(results) === "undefined" || results.length === 0) {
            print("No bookmarks found in folder");
            bookmark_pairs = [];
            return;
        }
        // Initialize new_bookmark_pairs
        var new_bookmark_pairs = [];

        // Populate the new array
        results.forEach(element => {
            new_bookmark_pairs.push(element);
        });

        // Print the new array
        new_bookmark_pairs.forEach(element => {
            print(`${element.title}:${element.url}`);
        });

        bookmark_pairs = new_bookmark_pairs;
        bookmark_mode = true;
    });
}

function move_folders() {

}

function change_folder_name() {
    // Get the folder name and (minimally) verify it
    var new_name = document.getElementById("folder_name_field").value;
    if (new_name === "") {
        return;
    }

    print("New Name: " + new_name + "\n");

    chrome.storage.sync.set({ 'DYBK_folder_name': new_name }, function (result) {
        // Move existing bookmarks if there is a current folder
        if (folder_name !== "") {
            print("Bookmarks should be moved\n");
        }

        // Update the folder_name variable (although it will already be done in init())
        folder_name = new_name;

        // Re-init to make the extension open the new folder
        init();
    });
}

// Utility function to print to the background script
function print(message) {
    chrome.extension.getBackgroundPage().console.log(message);
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