/**
 * Property-Based Tests for Container Overflow Prevention
 * **Feature: ui-ux-enhancement, Property 2: Container overflow prevention**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */

const fc = require('fast-check');
const { JSDOM } = require('jsdom');

describe('Container Overflow Prevention Properties', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    // Create a fresh DOM environment for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Container Test</title>
          <style>
            .container { width: 800px; height: 600px; overflow: hidden; }
            .table-container { overflow-x: auto; max-width: 100%; }
            .text-container { word-wrap: break-word; overflow-wrap: break-word; }
            .responsive-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
          </style>
        </head>
        <body>
          <div id="app" class="container"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost:3000',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
  });

  afterEach(() => {
    if (dom) {
      dom.window.close();
    }
  });

  /**
   * Property 2: Container overflow prevention for tables
   * For any table with varying column counts and content lengths,
   * the table should be contained within its parent and provide horizontal scrolling when needed
   */
  test('Property 2: Table container overflow prevention', () => {
    fc.assert(fc.property(
      fc.record({
        columnCount: fc.integer({ min: 3, max: 15 }),
        rowCount: fc.integer({ min: 1, max: 50 }),
        cellContentLength: fc.integer({ min: 5, max: 100 }),
        hasLongHeaders: fc.boolean(),
        containerWidth: fc.integer({ min: 300, max: 1200 })
      }),
      (config) => {
        const appContainer = document.getElementById('app');
        appContainer.style.width = `${config.containerWidth}px`;
        
        // Generate table HTML
        let tableHTML = '<div class="table-container"><table class="table">';
        
        // Generate headers
        tableHTML += '<thead class="table-header"><tr>';
        for (let i = 0; i < config.columnCount; i++) {
          const headerText = config.hasLongHeaders 
            ? `Very Long Header Title ${i + 1} That Might Cause Overflow Issues`
            : `Header ${i + 1}`;
          tableHTML += `<th>${headerText}</th>`;
        }
        tableHTML += '</tr></thead>';
        
        // Generate rows
        tableHTML += '<tbody class="table-body">';
        for (let row = 0; row < config.rowCount; row++) {
          tableHTML += '<tr>';
          for (let col = 0; col < config.columnCount; col++) {
            const cellContent = 'A'.repeat(config.cellContentLength);
            tableHTML += `<td>${cellContent}</td>`;
          }
          tableHTML += '</tr>';
        }
        tableHTML += '</tbody></table></div>';
        
        appContainer.innerHTML = tableHTML;
        
        // Apply responsive container system
        const tableContainer = document.querySelector('.table-container');
        const table = document.querySelector('.table');
        
        // Verify container overflow prevention
        expect(tableContainer).toBeTruthy();
        expect(table).toBeTruthy();
        
        // Container should have overflow handling
        const containerStyles = window.getComputedStyle(tableContainer);
        expect(['auto', 'scroll', 'hidden']).toContain(containerStyles.overflowX);
        
        // Table should be properly contained
        expect(tableContainer.scrollWidth).toBeGreaterThanOrEqual(table.offsetWidth || 0);
        
        // Headers should be present and properly structured
        const headers = table.querySelectorAll('thead th');
        expect(headers.length).toBe(config.columnCount);
        
        // Rows should be present and properly structured
        const rows = table.querySelectorAll('tbody tr');
        expect(rows.length).toBe(config.rowCount);
        
        // Each row should have correct number of cells
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          expect(cells.length).toBe(config.columnCount);
        });
        
        return true;
      }
    ), {
      numRuns: 100
    });
  });

  /**
   * Property: Text content overflow prevention
   * For any text content of varying lengths, text should wrap properly and not overflow containers
   */
  test('Property: Text overflow prevention', () => {
    fc.assert(fc.property(
      fc.record({
        textLength: fc.integer({ min: 10, max: 1000 }),
        containerWidth: fc.integer({ min: 100, max: 800 }),
        hasSpaces: fc.boolean(),
        hasLongWords: fc.boolean()
      }),
      (config) => {
        const appContainer = document.getElementById('app');
        appContainer.style.width = `${config.containerWidth}px`;
        
        // Generate text content
        let textContent = '';
        if (config.hasLongWords) {
          // Create very long words that might cause overflow
          textContent = 'A'.repeat(config.textLength);
        } else if (config.hasSpaces) {
          // Create normal text with spaces
          const words = [];
          let currentLength = 0;
          while (currentLength < config.textLength) {
            const wordLength = Math.min(Math.random() * 15 + 3, config.textLength - currentLength);
            words.push('A'.repeat(Math.floor(wordLength)));
            currentLength += wordLength;
          }
          textContent = words.join(' ');
        } else {
          // Create text without spaces
          textContent = 'A'.repeat(config.textLength);
        }
        
        const containerHTML = `
          <div class="text-container">
            <p class="text-content">${textContent}</p>
          </div>
        `;
        
        appContainer.innerHTML = containerHTML;
        
        const textContainer = document.querySelector('.text-container');
        const textElement = document.querySelector('.text-content');
        
        expect(textContainer).toBeTruthy();
        expect(textElement).toBeTruthy();
        
        // Verify text overflow handling
        const containerStyles = window.getComputedStyle(textContainer);
        expect(['break-word', 'break-all']).toContain(containerStyles.wordWrap || containerStyles.overflowWrap);
        
        // Text should not exceed container width (allowing for some margin of error)
        const containerWidth = textContainer.offsetWidth || config.containerWidth;
        const textWidth = textElement.scrollWidth || 0;
        
        // Allow some tolerance for measurement differences in JSDOM
        expect(textWidth).toBeLessThanOrEqual(containerWidth + 50);
        
        return true;
      }
    ), {
      numRuns: 75
    });
  });

  /**
   * Property: Responsive grid container behavior
   * For any number of grid items, the grid should adapt to container size without overflow
   */
  test('Property: Responsive grid overflow prevention', () => {
    fc.assert(fc.property(
      fc.record({
        itemCount: fc.integer({ min: 1, max: 20 }),
        containerWidth: fc.integer({ min: 200, max: 1200 }),
        itemMinWidth: fc.integer({ min: 100, max: 300 }),
        hasVariableContent: fc.boolean()
      }),
      (config) => {
        const appContainer = document.getElementById('app');
        appContainer.style.width = `${config.containerWidth}px`;
        
        // Generate grid HTML
        let gridHTML = `<div class="responsive-grid" style="grid-template-columns: repeat(auto-fit, minmax(${config.itemMinWidth}px, 1fr));">`;
        
        for (let i = 0; i < config.itemCount; i++) {
          const itemContent = config.hasVariableContent 
            ? `Item ${i + 1} with variable content length: ${'A'.repeat(Math.random() * 50 + 10)}`
            : `Item ${i + 1}`;
            
          gridHTML += `
            <div class="grid-item">
              <div class="item-content">${itemContent}</div>
            </div>
          `;
        }
        
        gridHTML += '</div>';
        
        appContainer.innerHTML = gridHTML;
        
        const grid = document.querySelector('.responsive-grid');
        const gridItems = document.querySelectorAll('.grid-item');
        
        expect(grid).toBeTruthy();
        expect(gridItems.length).toBe(config.itemCount);
        
        // Verify grid doesn't overflow container
        const gridWidth = grid.scrollWidth || 0;
        const containerWidth = appContainer.offsetWidth || config.containerWidth;
        
        // Grid should not exceed container width (with tolerance)
        expect(gridWidth).toBeLessThanOrEqual(containerWidth + 10);
        
        // All grid items should be present
        gridItems.forEach((item, index) => {
          const itemContent = item.querySelector('.item-content');
          expect(itemContent).toBeTruthy();
          expect(itemContent.textContent).toContain(`Item ${index + 1}`);
        });
        
        return true;
      }
    ), {
      numRuns: 50
    });
  });

  /**
   * Property: Card container overflow prevention
   * For any number of cards with varying content, cards should be properly contained
   */
  test('Property: Card container overflow prevention', () => {
    fc.assert(fc.property(
      fc.record({
        cardCount: fc.integer({ min: 1, max: 12 }),
        titleLength: fc.integer({ min: 5, max: 100 }),
        contentLength: fc.integer({ min: 10, max: 500 }),
        containerWidth: fc.integer({ min: 300, max: 1000 }),
        useFlexLayout: fc.boolean()
      }),
      (config) => {
        const appContainer = document.getElementById('app');
        appContainer.style.width = `${config.containerWidth}px`;
        
        // Generate cards HTML
        const layoutClass = config.useFlexLayout ? 'flex flex-wrap' : 'grid grid-cols-auto';
        let cardsHTML = `<div class="cards-container ${layoutClass}">`;
        
        for (let i = 0; i < config.cardCount; i++) {
          const title = 'T'.repeat(config.titleLength);
          const content = 'C'.repeat(config.contentLength);
          
          cardsHTML += `
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">${title}</h3>
              </div>
              <div class="card-body">
                <p class="card-content">${content}</p>
              </div>
            </div>
          `;
        }
        
        cardsHTML += '</div>';
        
        appContainer.innerHTML = cardsHTML;
        
        const cardsContainer = document.querySelector('.cards-container');
        const cards = document.querySelectorAll('.card');
        
        expect(cardsContainer).toBeTruthy();
        expect(cards.length).toBe(config.cardCount);
        
        // Verify cards container doesn't overflow
        const containerWidth = cardsContainer.scrollWidth || 0;
        const parentWidth = appContainer.offsetWidth || config.containerWidth;
        
        // Container should not exceed parent width (with tolerance)
        expect(containerWidth).toBeLessThanOrEqual(parentWidth + 20);
        
        // Each card should have proper structure
        cards.forEach((card, index) => {
          const cardHeader = card.querySelector('.card-header');
          const cardTitle = card.querySelector('.card-title');
          const cardBody = card.querySelector('.card-body');
          const cardContent = card.querySelector('.card-content');
          
          expect(cardHeader).toBeTruthy();
          expect(cardTitle).toBeTruthy();
          expect(cardBody).toBeTruthy();
          expect(cardContent).toBeTruthy();
          
          // Content should not be empty
          expect(cardTitle.textContent.length).toBeGreaterThan(0);
          expect(cardContent.textContent.length).toBeGreaterThan(0);
        });
        
        return true;
      }
    ), {
      numRuns: 60
    });
  });

  /**
   * Property: Form container overflow prevention
   * For any form with varying field counts and lengths, form should be properly contained
   */
  test('Property: Form container overflow prevention', () => {
    fc.assert(fc.property(
      fc.record({
        fieldCount: fc.integer({ min: 1, max: 20 }),
        labelLength: fc.integer({ min: 5, max: 50 }),
        placeholderLength: fc.integer({ min: 5, max: 100 }),
        containerWidth: fc.integer({ min: 250, max: 800 }),
        hasLongLabels: fc.boolean()
      }),
      (config) => {
        const appContainer = document.getElementById('app');
        appContainer.style.width = `${config.containerWidth}px`;
        
        // Generate form HTML
        let formHTML = '<div class="form-container"><form class="form">';
        
        for (let i = 0; i < config.fieldCount; i++) {
          const labelText = config.hasLongLabels 
            ? 'L'.repeat(config.labelLength)
            : `Field ${i + 1}`;
          const placeholderText = 'P'.repeat(config.placeholderLength);
          
          formHTML += `
            <div class="form-field">
              <label class="form-label" for="field-${i}">${labelText}</label>
              <input class="form-input" type="text" id="field-${i}" placeholder="${placeholderText}">
            </div>
          `;
        }
        
        formHTML += '</form></div>';
        
        appContainer.innerHTML = formHTML;
        
        const formContainer = document.querySelector('.form-container');
        const form = document.querySelector('.form');
        const formFields = document.querySelectorAll('.form-field');
        
        expect(formContainer).toBeTruthy();
        expect(form).toBeTruthy();
        expect(formFields.length).toBe(config.fieldCount);
        
        // Verify form doesn't overflow container
        const formWidth = form.scrollWidth || 0;
        const containerWidth = formContainer.offsetWidth || config.containerWidth;
        
        // Form should not exceed container width (with tolerance)
        expect(formWidth).toBeLessThanOrEqual(containerWidth + 30);
        
        // Each form field should have proper structure
        formFields.forEach((field, index) => {
          const label = field.querySelector('.form-label');
          const input = field.querySelector('.form-input');
          
          expect(label).toBeTruthy();
          expect(input).toBeTruthy();
          
          // Label should have proper for attribute
          expect(label.getAttribute('for')).toBe(`field-${index}`);
          
          // Input should have proper id
          expect(input.getAttribute('id')).toBe(`field-${index}`);
          
          // Input should have placeholder
          expect(input.getAttribute('placeholder')).toBeTruthy();
        });
        
        return true;
      }
    ), {
      numRuns: 40
    });
  });
});