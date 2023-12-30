// Handlebars helper to compare two values
Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

// Fetch template from server then render it into given element
async function fetchAndRenderTemplate(selector, templatePath, context) {
    const response = await fetch(templatePath);
    const data = await response.text();
    const template = Handlebars.compile(data);
    document.querySelector(selector).innerHTML = template(context);
}

// Fetch the table template and render it with the data from the given endpoint
function showTable(endpoint, type) {
    console.log(type);
    fetch(endpoint).then((response) => {
        return response.json();
    }).then((data) => {
        fetchAndRenderTemplate("#main", "/static/templates/table.html", { ...data, type: type });
    });
}

// Show parts and storages tables
function showParts() {
    showTable("/api/parts", "PART");
}

function showStorage() {
    showTable("/api/storages", "STORAGE");
}

// Show the form for a new part or storage
function showCreateNewForm(type) {
    document.querySelector("#main").innerHTML = "";
    switch (type) {
        case "PART":
            fetch("/api/storage_names").then((response) => {
                return response.json();
            }).then((data) => {
                fetchAndRenderTemplate("#main", "/static/templates/edit_part.html", {
                    new: true,
                    names: data
                });
            });
            break;
        case "STORAGE":
            alert("Not implemented yet!");
            break;
        default:
            alert("Unknown type!");
            break;
    }
}

// Show the same form but for editing an existing part or storage
function showEditForm(type, id) {
    document.querySelector("#main").innerHTML = "";
    switch (type) {
        case "PART":
            fetch(`/api/parts/${id}`).then((response) => {
                return response.json();
            }).then((parts_data) => {
                fetch("/api/storage_names").then((response) => {
                    return response.json();
                }).then((storage_data) => {
                    const data = { ...storage_data, ...parts_data, new: false }
                    fetchAndRenderTemplate("#main", "/static/templates/edit_part.html", data);
                });
            });
            break;
        case "STORAGE":
            alert("Not implemented yet!");
            break;
        default:
            alert("Unknown type!");
            break;
    }
}

// Function to create a new part
function create_part(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch("/api/parts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then((response) => {
        if (response.status == 200) {
            showParts();
        } else {
            console.error(response);
        }
    }).catch((error) => {
        console.error(error);
    });

    return false;
}

// Function to update an existing part
function update_part(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch(`/api/parts/${data.Id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then((response) => {
        if (response.status == 200) {
            showParts();
        } else {
            console.error(response);
        }
    }).catch((error) => {
        console.error(error);
    });

    return false;
}
