# Lumina Finance — Predictive Wealth Dashboard

A comprehensive personal finance dashboard with advanced UI/UX features, predictive data visualization, and intelligent expense tracking.

## Features

### 🎯 Advanced UI/UX Requirements

1. **Quick-Add Command Center with NLP**
   - Natural Language Processing for expense entry
   - Type commands like: "Spent 50 on Dinner at Mario's yesterday"
   - Automatically parses amount, category, and date
   - Real-time preview of parsed data

2. **Comparison Layers (Ghost Trace)**
   - Multi-line chart showing current month's spending
   - Faint "ghost trace" showing previous month's trends
   - Instant visual comparison for financial analysis
   - Interactive hover/touch tooltips

3. **Micro-Budgeting Feedback**
   - Dynamic color-coded budget cards
   - Green (safe) → Amber (warning at 80%) → Red (danger at 100%)
   - Pulsing animations for warning states
   - Real-time budget progress tracking

4. **Haptic Data Scrubbing**
   - Touch-friendly chart interactions
   - Slide finger across charts to see exact values
   - Tooltips follow finger movement on mobile/tablet
   - Mouse hover support for desktop

### 📊 Front-end & Technical Features

1. **Data Visualization**
   - **Multi-line Chart**: Canvas-based spending trends with ghost trace
   - **Sunburst Chart**: D3.js nested pie chart for category/subcategory visualization
   - **Category Pie Chart**: Visual breakdown of spending by category
   - Responsive design for all screen sizes

2. **Optimistic UI Updates**
   - Instant expense deletion from UI
   - Smooth animations and transitions
   - Graceful error handling with notifications
   - Real-time data synchronization

3. **Performance Optimization**
   - Efficient data filtering and rendering
   - Optimized chart rendering
   - Memoized calculations for large datasets
   - Smooth animations with CSS transforms

4. **PDF Export**
   - Generate monthly financial reports
   - Export entire dashboard to PDF
   - High-quality vector graphics
   - Professional report formatting

5. **Expense Images**
   - Automatic image assignment based on category
   - Images from Unsplash API
   - Fallback images for missing categories
   - Visual expense cards with images

## Usage

### Getting Started

1. Open `index.html` in a modern web browser
2. The dashboard will load with sample data
3. Start adding expenses using the Quick-Add Command Center

### Adding Expenses

**Natural Language Examples:**
- "Spent 50 on Dinner at Mario's yesterday"
- "Paid $120 for Groceries today"
- "Spent 35 on gas last week"
- "Bought movie tickets for $85"

The system automatically:
- Extracts the amount
- Identifies the category (Food, Transportation, Entertainment, etc.)
- Determines the date (today, yesterday, last week)
- Parses the description/merchant name

### Managing Expenses

- **View Expenses**: Scroll through the expenses list
- **Filter by Category**: Use the dropdown to filter expenses
- **Delete Expenses**: Click the trash icon to remove expenses
- **View Charts**: Interactive charts update in real-time

### Budget Management

- Budget cards show progress for each category
- Color changes indicate budget status:
  - 🟢 Green: Under 80% used
  - 🟡 Amber: 80-100% used (pulsing warning)
  - 🔴 Red: Over budget (pulsing danger)

### Exporting Reports

Click the "Export PDF" button to generate a monthly financial report including:
- All expense data
- Charts and visualizations
- Budget summaries
- Financial statistics

## Technical Details

### Libraries Used

- **D3.js v7**: For Sunburst chart visualization
- **html2pdf.js**: For PDF export functionality
- **Canvas API**: For custom chart rendering
- **Vanilla JavaScript**: No framework dependencies

### Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Data Storage

- Currently uses in-memory storage (localStorage can be added)
- Data persists during session
- Sample data loads on page refresh

## Customization

### Adding Categories

Edit the `budgets` object in the JavaScript:
```javascript
budgets['YourCategory'] = { limit: 500, spent: 0 };
```

### Adding Category Keywords

Edit the `categoryKeywords` object to improve NLP parsing:
```javascript
'YourCategory': ['keyword1', 'keyword2', 'keyword3']
```

### Styling

All styles are in the `<style>` section. Customize CSS variables:
```css
:root {
    --primary: #6366f1;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
}
```

## Future Enhancements

- [ ] LocalStorage persistence
- [ ] Backend integration
- [ ] Advanced analytics and predictions
- [ ] Multiple currency support
- [ ] Expense receipts upload
- [ ] Goal setting and tracking
- [ ] Investment tracking
- [ ] Recurring expense management

## License

This project is open source and available for personal and educational use.

---

**Built with ❤️ for the 100 Days of Code Challenge**

