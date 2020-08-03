// Initial variables
var folder_name = "";       // Records folder name
var bookmark_pairs = [];
var bookmark_mode = false;
var parent_folder = null;

// Intialize event listeners (to avoid inline-scripts)
document.getElementById("folder_name_submit").onclick = change_folder_name;

// Run init() (which can be run multiple times)
init();

// This function is the initial function, which can be run anytime to refresh the bookmarks/folder
async function init() {
    // Shorcut to reduce function call complexity
    let storage = chrome.storage.sync;

    // Obtain the folder name from chrome storage
    let name = await promise_wrapper(storage.get, storage, ['DYBK_folder_name']);
    if (typeof(name) === "undefined") {
        print("Folder not found");
        bookmark_mode = false;
        return;
    }
    folder_name = name.DYBK_folder_name;
    document.getElementById("demo").innerHTML = folder_name;

    await search_create_folder();
    await populate_bookmarks();
    await update_bookmark_dropdown();
}

// This function will find the bookmark folder, creating it if it needs to
async function search_create_folder() {
    // Shortcut to reduce function call complexity
    let bookmarks = chrome.bookmarks;

    // Get the ID of the "Other Bookmarks" folder
    let otherBookmarksID = (await promise_wrapper(bookmarks.getTree, bookmarks))[0].children[1].id;

    // Search for the correct folder
    let search_term = {
        'title': folder_name
    };
    let searchResults = (await promise_wrapper(bookmarks.search, bookmarks, [search_term]));
    if (typeof (searchResults) === "undefined" || searchResults.length === 0) {
        // Create the folder
        print("Results not found, making folder");
        create_folder();
    } else {
        print("Results found, verifying");

        // Check if a result has "Other Bookmarks" as the parent
        let target = null;
        searchResults.forEach((element) => {
            // Check that this element is a folder on another
            if (element.parentId == otherBookmarksID && typeof(element.url) === "undefined") {
                target = element;
            }
        });
        if (target === null) {
            // A bookmark with the same name as the folder is found, but it isn't a folder in the proper section
            print("Results incorrect, making folder");
            create_folder();
        } else {
            parent_folder = target;
        }
    }
    return;
}

// This function creates the bookmark folder (called by search_create_folder)
async function create_folder() {
    // Shortcut to reduce function call complexity
    let bookmarks = chrome.bookmarks;

    // The two properties of the new folder that matter
    let new_folder_props = {
        'parentId': otherBookmarksID,
        'title': folder_name
    };
    let created_folder = await promise_wrapper(bookmarks.create, bookmarks, [new_folder_props]);
    parent_folder = created_folder;
    print("Created " + parent_folder.title + " bookmark folder");
}

// This function populates bookmarks into the bookmark folder
async function populate_bookmarks() {
    print("populating bookmarks");

    let bookmarks = chrome.bookmarks;
    let results = await promise_wrapper(bookmarks.getChildren,bookmarks,[parent_folder.id]);
    if (typeof (results) === "undefined" || results.length === 0) {
        print("No bookmarks found in folder");
        bookmark_pairs = [];
        return;
    }
    // Initialize new_bookmark_pairs
    let new_bookmark_pairs = [];

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
}

// Update the bookmark dropdown menu on the extension
async function update_bookmark_dropdown() {
    // Use a variable as a shortcut
    let dropdown = Document.getElementById("bookmark_selection");

    // Fill the table with an invalid option if the folder must be created
    if (bookmark_mode = false) {
        dropdown.innerHTML = '<option value="no_bookmarks">--</option>\n';
        return;
    } else {
        let dropdown_contents = '';
        bookmark_pairs.forEach((element) => {
            dropdown_contents += `<option value="${element.title}">${element.title}</option>`;
        });
        dropdown_contents += '<option value="new_bookmark">Create a New Bookmark</option>';
        dropdown.innerHTML = dropdown_contents;
    }
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

// Utility function to allow async/await to be used on the chrome functions (thus avoiding callback hell)
function promise_wrapper(func, context, options = []) {
    let newFunc = func.bind(context);
    return new Promise(
        (resolve) => {
            newFunc(...options, resolve);
        }
    );
}

// Utility function to print to the background script
function print(message) {
    chrome.extension.getBackgroundPage().console.log(message);
}