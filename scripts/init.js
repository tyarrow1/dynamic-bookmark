// Initial variables
var folder_name = "";       // Records folder name
var bookmark_pairs = [];
var bookmark_mode = false;
var parent_folder = null;

// Shortcuts for chrome things
var storage = chrome.storage.sync;
var bookmarks = chrome.bookmarks;

// Intialize event listeners (to avoid inline-scripts)
document.getElementById("folder_name_submit").onclick = change_folder_name;
document.getElementById("bookmark_update").onclick = set_bookmark;
document.getElementById("bookmark_delete").onclick = delete_bookmark;
document.getElementById("bookmark_create").onclick = create_bookmark;

// Run init() upon popup load (which can be run multiple times)
init();

// CORE FUNCTIONS
//---------------------------------------------------------------------
// This function is the initial function, which can be run anytime to refresh the bookmarks/folder
async function init() {
    // Obtain the folder name from chrome storage
    let name = await promise_wrapper(storage.get, storage, 'DYBK_folder_name');
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
    // Get the ID of the "Other Bookmarks" folder
    let otherBookmarksID = (await promise_wrapper(bookmarks.getTree, bookmarks))[0].children[1].id;

    // Search for the correct folder
    let search_term = {
        'title': folder_name
    };
    let searchResults = (await promise_wrapper(bookmarks.search, bookmarks, search_term));
    if (typeof (searchResults) === "undefined" || searchResults.length === 0) {
        // Create the folder
        print("Results not found, making folder");
        await create_folder(otherBookmarksID);
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
            await create_folder(otherBookmarksID);
        } else {
            parent_folder = target;
        }
    }
    return;
}

// This function creates the bookmark folder (called by search_create_folder)
async function create_folder(parentId) {
    // The two properties of the new folder that matter
    let new_folder_props = {
        'parentId': parentId,
        'title': folder_name
    };
    let created_folder = await promise_wrapper(bookmarks.create, bookmarks, new_folder_props);
    parent_folder = created_folder;
    print("Created " + parent_folder.title + " bookmark folder");
}

// This function populates bookmarks into the bookmark folder
async function populate_bookmarks() {
    print("populating bookmarks");

    let results = await promise_wrapper(bookmarks.getChildren,bookmarks,parent_folder.id);
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
    let dropdown = document.getElementById("bookmark_selection");

    // TODO: Alphabetically sort bookmark entries in the dropdown, place the current URL's bookmark on top of the list

    // Fill the table with an invalid option if the folder must be created
    if (bookmark_mode = false) {
        dropdown.innerHTML = '<option value="no_bookmarks">--</option>\n';
        return;
    } else {
        let dropdown_contents = '';
        bookmark_pairs.forEach((element) => {
            dropdown_contents += `<option value="${element.title}">${element.title}</option>`;
        });
        if (dropdown_contents === '') {
            dropdown_contents += '<option value="new_bookmark">Create a New Bookmark</option>';
        }
        
        dropdown.innerHTML = dropdown_contents;
    }
}

function move_folders() {

}


// BUTTON FUNCTIONS
//---------------------------------------------------------------------
// Function for setting the bookmark (activated via the "update" button)
async function set_bookmark() {
    let bookmark_name = document.getElementById("bookmark_selection").value;

    // TODO: more bookmark name verification

    if (bookmark_name === "new_bookmark") {
        print("Can't update the 'create bookmark' option");
        return;
    }

    let new_bookmark_url = await current_url();

    // Next, update the bookmark's url
}

// Function for removing a bookmark (activated via the "delete" button)
async function delete_bookmark() {
    let bookmark_name = document.getElementById("bookmark_selection").value;

    // TODO: more bookmark name verification

    if (bookmark_name === "new_bookmark") {
        print("Can't delete the 'create bookmark' option");
        return;
    }

    // Next, delete the bookmark
}

// Function for creating a new bookmark (activated via the "create" button)
async function create_bookmark() {
    let bookmark_name = document.getElementById("bookmark_name_field").value;
    
    // TODO: Input verify to make sure that it doesn't overwrite any existing bookmarks

    if (bookmark_name === "") {
        print("Bookmark has no name");
        return;
    }
    let bookmark_url = await current_url();

    let new_bookmark = {
        "parentId": parent_folder.id,
        "title": bookmark_name,
        "url": bookmark_url
    };

    print(`Creating ${bookmark_name}:${bookmark_url}`);

    await promise_wrapper(bookmarks.create,bookmarks,new_bookmark);

    await populate_bookmarks();
}

// Function for changing the folder that the bookmarks are stored in
async function change_folder_name() {
    // Get the folder name and (minimally) verify it
    let new_name = document.getElementById("folder_name_field").value;
    if (new_name === "") {
        return;
    }

    print("New Name: " + new_name + "\n");

    await promise_wrapper(storage.set,storage,{ 'DYBK_folder_name': new_name });
    // Move existing bookmarks if there is a current folder
    if (folder_name !== "") {
        print("Bookmarks should be moved\n");
    }

    // Update the folder_name variable (although it will already be done in init())
    folder_name = new_name;

    // Re-init to make the extension open the new folder
    init();
}


// UTILITY FUNCTIONS
//---------------------------------------------------------------------
// Utility function to allow async/await to be used on the chrome functions (thus avoiding callback hell)
function promise_wrapper(func, context, options = []) {
    let newFunc = func.bind(context);
    if (!Array.isArray(options)) {
        options = [options];
    }
    return new Promise(
        (resolve) => {
            newFunc(...options, resolve);
        }
    );
}

// Utility function to get the current tab's url
async function current_url() {
    let tabs = await promise_wrapper(chrome.tabs.query,chrome.tabs,{"active":true,"windowId":chrome.windows.WINDOW_ID_CURRENT});
    print(tabs);
    return tabs[0].url;
}

// Utility function to print to the background script
function print(message) {
    chrome.extension.getBackgroundPage().console.log(message);
}