// Fetch template from server then render it into given element
async function fetchAndRenderTemplate(selector, templatePath, context) {
    const response = await fetch(templatePath);
    const data = await response.text();
    const template = Handlebars.compile(data);
    document.querySelector(selector).innerHTML = template(context);
}

// Show parts and storages tables
function showParts() {
    fetch("/api/parts").then((response) => {
        return response.json();
    }).then((data) => {
        fetchAndRenderTemplate("#main", "/static/templates/part_table.hbs", data).then(() => {
            showContent();
        });
    });
}

function showStorage() {
    fetch("/api/storages").then((response) => {
        return response.json();
    }).then((data) => {
        fetchAndRenderTemplate("#main", "/static/templates/storage_table.hbs", data).then(() => {
            showContent();
        });
    });
}

// Show the form for a new part or storage
function showCreateNewForm(type) {
    hideContent();

    switch (type) {
        case "PART":
            fetch("/api/storage_names").then((response) => {
                return response.json();
            }).then((storage_data) => {
                fetchAndRenderTemplate("#main", "/static/templates/part_form.hbs", {
                    new: true,
                    ...storage_data
                }).then(() => {
                    showContent();
                });
            });
            break;
        case "STORAGE":
            fetchAndRenderTemplate("#main", "/static/templates/new_storage_form.hbs", {}).then(() => {
                showContent();
            });
            break;
        default:
            alert("Unknown type!");
            break;
    }
}

// Show the same form but for editing an existing part or storage
function showEditForm(type, id) {
    hideContent();

    switch (type) {
        case "PART":
            fetch(`/api/parts/${id}`).then((response) => {
                return response.json();
            }).then((parts_data) => {
                fetch("/api/storage_names").then((response) => {
                    return response.json();
                }).then((storage_data) => {
                    const data = { ...storage_data, ...parts_data, new: false }
                    fetchAndRenderTemplate("#main", "/static/templates/part_form.hbs", data).then(() => {
                        showContent();
                    });
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
function API_CreatePart(form) {
    hideContent();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch("/api/parts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(async (response) => {
        if (response.status == 200) {
            showParts();
        } else {
            alert(await response.text());
            showContent();
        }
    }).catch((error) => {
        alert(error);
        showContent();
    });

    return false;
}

// Function to update an existing part
function API_UpdatePart(form) {
    hideContent();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch(`/api/parts/${data.Id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(async (response) => {
        if (response.status == 200) {
            showParts();
        } else {
            alert(await response.text());
            showContent();
        }
    }).catch((error) => {
        alert(error);
        showContent();
    });

    return false;
}

function API_CreateStorage(form) {
    hideContent();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch("/api/storages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(async (response) => {
        if (response.status == 200) {
            showStorage();
        } else {
            alert(await response.text());
            showContent();
        }
    }).catch((error) => {
        alert(error);
        showContent();
    });

    return false;
}

function hideContent() {
    document.querySelector("#main").style.display = "none";
}

function showContent() {
    document.querySelector("#main").style.display = "block";
}
