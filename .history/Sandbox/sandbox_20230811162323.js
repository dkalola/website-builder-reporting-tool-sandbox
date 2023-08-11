// This code allows the website to turn into editable website.

// Function to assign the "editable" class and unique IDs to elements with text content
function assignEditableClassAndUniqueIds() {
  const allElements = document.body.querySelectorAll("*");
  const findElement = [];

  allElements.forEach((element, index) => {
    const childNodes = element.childNodes;

    if (childNodes.length === 1) {
      findElement.push(childNodes);
      console.log(childNodes[0]);
      element.classList.add("editable");
    }
  });

  console.log(findElement);
}

// Call the function to assign the class and unique IDs when the page loads
window.addEventListener("DOMContentLoaded", () => {
  assignEditableClassAndUniqueIds();

  // Get all editable elements
  const editableElements = document.querySelectorAll(".editable");

  // Attach event listeners to each editable element
  editableElements.forEach((element) => {
    element.addEventListener("dblclick", () => {
      console.log("Double-click event triggered.");
      makeEditable(element);
    });
  });

  // Function to make an element editable
  function makeEditable(element) {
    element.contentEditable = true;
    element.focus();

    // Save the original content for canceling edits
    const originalContent = element.innerHTML;

    // Attach a blur event listener to save changes
    element.addEventListener("blur", () => {
      element.contentEditable = false;

      // Perform any additional processing (e.g., validation, saving changes)

      // Remove the blur event listener
      element.removeEventListener("blur");

      // Optionally, you can also listen for the "Enter" key to save changes
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          element.blur();
        }
      });
    });

    // Optionally, allow canceling edits with the "Esc" key
    element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        element.innerHTML = originalContent;
        element.blur();
      }
    });
  }
});
