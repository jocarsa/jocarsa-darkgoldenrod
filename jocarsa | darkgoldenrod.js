/* jocarsa-darkgoldenrod.js */

(function() {
  let jocarsaDarkgoldenrodCurrentElement = null;
  let jocarsaDarkgoldenrodToolbar = null;
  let propsData = null; // will store the fetched JSON data

  // Fetch JSON and init
  async function init() {
    try {
      const response = await fetch('https://jocarsa.github.io/jocarsa-darkgoldenrod/jocarsa-darkgoldenrod-props.json');
      //const response = await fetch('jocarsa-darkgoldenrod-props.json');
      propsData = await response.json();
      // Once JSON is loaded, build the toolbar
      jocarsaDarkgoldenrodToolbar = createToolbar(propsData);
      makeToolbarDraggable(jocarsaDarkgoldenrodToolbar);
      setupAccordion(jocarsaDarkgoldenrodToolbar);
      attachGlobalEvents();
      attachWindowEvents();
    } catch (error) {
      console.error('[jocarsa-darkgoldenrod] Failed to load JSON:', error);
    }
  }

  // ================== CREATE TOOLBAR DYNAMICALLY ==================
  function createToolbar(json) {
    const toolbar = document.createElement('div');
    toolbar.className = 'jocarsa-darkgoldenrod-toolbar';
    // Ensure the toolbar is absolutely positioned
    toolbar.style.position = 'absolute';
    toolbar.style.zIndex = '1000';
    toolbar.style.display = 'none';
    toolbar.style.border = '1px solid #ccc';
    toolbar.style.background = '#fff';

    // The drag handle area will be added separately

    // Build accordion sections from the JSON
    json.sections.forEach((section, index) => {
      const item = document.createElement('div');
      item.className = 'jocarsa-darkgoldenrod-accordion-item';

      // Title
      const title = document.createElement('div');
      title.className = 'jocarsa-darkgoldenrod-accordion-title';
      title.textContent = section.title;
      item.appendChild(title);

      // Content
      const content = document.createElement('div');
      content.className = 'jocarsa-darkgoldenrod-accordion-content';

      // For each property in the section, create a label + input
      section.properties.forEach((propDef) => {
        const label = document.createElement('label');
        label.textContent = propDef.label;

        // Create the input based on propDef.type
        let inputEl;
        switch (propDef.type) {
          case 'color':
            inputEl = document.createElement('input');
            inputEl.type = 'color';
            break;
          case 'text':
            inputEl = document.createElement('input');
            inputEl.type = 'text';
            if (propDef.placeholder) {
              inputEl.placeholder = propDef.placeholder;
            }
            break;
          case 'number':
            inputEl = document.createElement('input');
            inputEl.type = 'number';
            if (propDef.min !== undefined) inputEl.min = propDef.min;
            if (propDef.max !== undefined) inputEl.max = propDef.max;
            if (propDef.step !== undefined) inputEl.step = propDef.step;
            if (propDef.default !== undefined) inputEl.value = propDef.default;
            break;
          case 'select':
            inputEl = document.createElement('select');
            if (Array.isArray(propDef.options)) {
              propDef.options.forEach(opt => {
                const optionEl = document.createElement('option');
                optionEl.value = opt.value;
                optionEl.textContent = opt.label;
                inputEl.appendChild(optionEl);
              });
            }
            break;
          default:
            // fallback to text
            inputEl = document.createElement('input');
            inputEl.type = 'text';
            break;
        }

        // Listen for changes to apply style
        inputEl.addEventListener('input', () => {
          applyStyle(propDef.property, inputEl.value);
        });
        inputEl.addEventListener('change', () => {
          applyStyle(propDef.property, inputEl.value);
        });

        // Put input inside label
        label.appendChild(inputEl);

        // Put label inside content
        content.appendChild(label);
      });

      item.appendChild(content);
      toolbar.appendChild(item);
    });

    document.body.appendChild(toolbar);
    return toolbar;
  }

  // ================== MAKE TOOLBAR DRAGGABLE ==================
  function makeToolbarDraggable(toolbar) {
    // Create a drag handle area
    const dragHandle = document.createElement('div');
    dragHandle.className = 'jocarsa-darkgoldenrod-drag-handle';
    dragHandle.textContent = 'Drag me';
    // Style the drag handle (you can customize as needed)
    dragHandle.style.cursor = 'move';
    dragHandle.style.background = '#eee';
    dragHandle.style.padding = '4px';
    dragHandle.style.textAlign = 'center';
    dragHandle.style.borderBottom = '1px solid #ccc';

    // Insert drag handle at the top of the toolbar
    toolbar.insertBefore(dragHandle, toolbar.firstChild);

    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    dragHandle.addEventListener('mousedown', function(e) {
      e.preventDefault(); // Prevent text selection
      isDragging = true;
      offsetX = e.clientX - toolbar.offsetLeft;
      offsetY = e.clientY - toolbar.offsetTop;

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    });

    function mouseMoveHandler(e) {
      if (!isDragging) return;
      toolbar.style.left = (e.clientX - offsetX) + 'px';
      toolbar.style.top = (e.clientY - offsetY) + 'px';
    }

    function mouseUpHandler() {
      isDragging = false;
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    }
  }

  // ================== APPLY A STYLE ==================
  function applyStyle(cssProperty, value) {
    if (!jocarsaDarkgoldenrodCurrentElement) return;

    // Special handling for backgroundImage (add "url(...)" if not empty)
    if (cssProperty === 'backgroundImage') {
      if (value.trim() !== '') {
        jocarsaDarkgoldenrodCurrentElement.style[cssProperty] = `url('${value}')`;
        // Optionally set background-size or repeat if desired:
        jocarsaDarkgoldenrodCurrentElement.style.backgroundSize = 'cover';
        jocarsaDarkgoldenrodCurrentElement.style.backgroundRepeat = 'no-repeat';
      } else {
        // reset
        jocarsaDarkgoldenrodCurrentElement.style[cssProperty] = '';
      }
    } else if (value === '' || value == null) {
      // If empty, reset property
      jocarsaDarkgoldenrodCurrentElement.style[cssProperty] = '';
    } else if (cssProperty.match(/(margin|padding|width|height|top|left|right|bottom|fontSize|lineHeight|borderWidth)/)) {
      // If property is likely numeric + "px"
      jocarsaDarkgoldenrodCurrentElement.style[cssProperty] = `${value}px`;
    } else {
      // Otherwise, just assign
      jocarsaDarkgoldenrodCurrentElement.style[cssProperty] = value;
    }
  }

  // ================== ACCORDION SETUP ==================
  function setupAccordion(toolbar) {
    const titles = toolbar.querySelectorAll('.jocarsa-darkgoldenrod-accordion-title');
    titles.forEach(title => {
      title.addEventListener('click', () => {
        title.classList.toggle('active');
        const content = title.nextElementSibling;
        if (title.classList.contains('active')) {
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      });
    });
  }

  // ================== GLOBAL EVENTS ==================
  function attachGlobalEvents() {
    // 1) When focusing on a contenteditable, set that as current
    document.addEventListener('focusin', (e) => {
      if (e.target && e.target.isContentEditable) {
        jocarsaDarkgoldenrodCurrentElement = e.target;
        positionToolbar(jocarsaDarkgoldenrodCurrentElement, jocarsaDarkgoldenrodToolbar);
        showToolbar(jocarsaDarkgoldenrodToolbar);
      }
    }, true);

    // 2) Hide toolbar if user clicks outside both the toolbar and the contenteditable
    document.addEventListener('click', (e) => {
      // Use the composedPath to correctly detect if the click was inside our elements
      const path = e.composedPath();
      if (
        jocarsaDarkgoldenrodCurrentElement &&
        !path.includes(jocarsaDarkgoldenrodCurrentElement) &&
        !path.includes(jocarsaDarkgoldenrodToolbar)
      ) {
        hideToolbar(jocarsaDarkgoldenrodToolbar);
        jocarsaDarkgoldenrodCurrentElement = null;
      }
    });
  }

  // ================== WINDOW SCROLL/RESIZE EVENTS ==================
  function attachWindowEvents() {
    window.addEventListener('scroll', () => {
      if (jocarsaDarkgoldenrodCurrentElement) {
        positionToolbar(jocarsaDarkgoldenrodCurrentElement, jocarsaDarkgoldenrodToolbar);
      }
    });
    window.addEventListener('resize', () => {
      if (jocarsaDarkgoldenrodCurrentElement) {
        positionToolbar(jocarsaDarkgoldenrodCurrentElement, jocarsaDarkgoldenrodToolbar);
      }
    });
  }

  // ================== POSITION / SHOW / HIDE TOOLBAR ==================
  function positionToolbar(element, toolbar) {
    if (!element || !toolbar) return;
    const rect = element.getBoundingClientRect();
    const toolbarHeight = toolbar.offsetHeight;

    // Attempt to place it above the element
    let top = window.scrollY + rect.top - toolbarHeight - 8;
    if (top < 0) {
      // If there's no space above, place it below
      top = window.scrollY + rect.bottom + 8;
    }
    const left = window.scrollX + rect.left;

    toolbar.style.top = top + 'px';
    toolbar.style.left = left + 'px';
  }

  function showToolbar(toolbar) {
    if (toolbar) {
      toolbar.style.display = 'block';
    }
  }

  function hideToolbar(toolbar) {
    if (toolbar) {
      toolbar.style.display = 'none';
    }
  }

  // ================== START INIT ==================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

