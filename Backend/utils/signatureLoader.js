/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');

const loadSignature = (company, userData) => {
    try {
        // Try to load the specified company template
        const templatePath = path.join(__dirname, './emailSignatures/', `${company}.html`);
        let template = fs.readFileSync(templatePath, 'utf8');
        
        // Replace placeholders with actual data
        return template
            .replace('{{userName}}', userData.userName)
            .replace('{{designation}}', userData.designation);
    } catch (error) {
        console.error(`Error loading signature template for ${company}:`, error);
        
        // Fallback to default template
        try {
            const defaultPath = path.join(__dirname, '../config/emailSignatures', 'default.html');
            let defaultTemplate = fs.readFileSync(defaultPath, 'utf8');
            return defaultTemplate
                .replace('{{userName}}', userData.userName)
                .replace('{{designation}}', userData.designation);
        } catch (err) {
            console.error('Error loading default signature template:', err);
            return ''; // Return empty string if no template is available
        }
    }
};

module.exports = { loadSignature };