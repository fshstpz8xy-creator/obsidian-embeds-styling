// DIAGNOSTIC SCRIPT FOR OBSIDIAN CONSOLE
// Copy and paste this entire script into the Developer Console (Cmd+Option+I)

console.log('=== REGEX EMBED STYLING DIAGNOSTIC ===\n');

// 1. Check if plugin is loaded
const plugin = app.plugins.plugins['regex-embed-styling'];
console.log('1. Plugin loaded:', !!plugin);
if (plugin) {
    console.log('   - Plugin settings:', plugin.settings);
    console.log('   - Number of rules:', plugin.settings?.rules?.length);
}

// 2. Check if style element exists
const styleElement = document.getElementById('regex-embed-styling');
console.log('\n2. Style element exists:', !!styleElement);
if (styleElement) {
    const cssLength = styleElement.textContent.length;
    console.log('   - CSS length:', cssLength, 'characters');
    console.log('   - First 200 chars:', styleElement.textContent.substring(0, 200));

    // Check for key CSS rules
    const hasBorderRadius = styleElement.textContent.includes('border-radius: 0');
    const hasDisplayBlock = styleElement.textContent.includes('display: block');
    const hasBackgroundColor = styleElement.textContent.includes('background-color:');
    const hasDataRule = styleElement.textContent.includes('data-embed-rule="1764790422924"');

    console.log('   - Has border-radius: 0?', hasBorderRadius);
    console.log('   - Has display: block?', hasDisplayBlock);
    console.log('   - Has background-color?', hasBackgroundColor);
    console.log('   - Has rule 1764790422924?', hasDataRule);
}

// 3. Check embed elements
const embeds = document.querySelectorAll('.markdown-embed.regex-embed-styled');
console.log('\n3. Styled embeds found:', embeds.length);
if (embeds.length > 0) {
    const firstEmbed = embeds[0];
    console.log('   - First embed classes:', firstEmbed.className);
    console.log('   - Data-embed-rule:', firstEmbed.getAttribute('data-embed-rule'));

    // Check computed styles
    const computed = window.getComputedStyle(firstEmbed);
    console.log('   - Computed position:', computed.position);
    console.log('   - Computed display:', computed.display);
    console.log('   - Computed border-radius:', computed.borderRadius);

    // Check ::before pseudo-element
    const beforeStyles = window.getComputedStyle(firstEmbed, '::before');
    console.log('\n4. ::before pseudo-element:');
    console.log('   - Content:', beforeStyles.content);
    console.log('   - Position:', beforeStyles.position);
    console.log('   - Background-color:', beforeStyles.backgroundColor);
    console.log('   - Border:', beforeStyles.border);
    console.log('   - Width:', beforeStyles.width);
    console.log('   - Height:', beforeStyles.height);
    console.log('   - Display:', beforeStyles.display);
}

// 5. Check for conflicting styles
const allStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
console.log('\n5. Total style elements:', allStyles.length);
const embedStyles = allStyles.filter(s => {
    const content = s.textContent || s.href || '';
    return content.includes('markdown-embed') || content.includes('embed-styling');
});
console.log('   - Styles mentioning embeds:', embedStyles.length);

console.log('\n=== END DIAGNOSTIC ===');
