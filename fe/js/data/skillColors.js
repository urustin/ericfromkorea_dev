// Skill & Library -> Notion color, mirrored from the source database schema.
export const skillColors = {
  React: 'gray', Java: 'pink', ReactJS: 'default', Tailwind: 'blue',
  Javascript: 'green', Firebase: 'green', 'Build.io': 'yellow', NextJS: 'brown',
  'React Native': 'orange', Expo: 'purple', 'Google 0Auth': 'red',
  'Google Oauth': 'red', 'Facebook API': 'blue', AWS: 'yellow',
  ElectronJS: 'brown', 'Google Map API': 'red', NodeJS: 'purple',
  MongoDB: 'red', 'Passport.js': 'orange', 'OpenAI API': 'brown',
  'Google Vision API': 'default', 'Label Studio': 'blue', 'After Effect': 'green',
  ComfyUI: 'orange', Wireshark: 'yellow', Netplan: 'pink', Network: 'default',
  Python: 'blue', LangChain: 'blue', FastMCP: 'green', Gradio: 'red',
  Mermaid: 'orange',
};

// Status option -> color (matches the DB "Status" property).
export const statusColors = {
  'Not started': 'default',
  'In progress': 'blue',
  Done: 'green',
};

// Type option -> color (matches the DB "Type" property).
export const typeColors = {
  Main: 'brown',
  Optional: 'green',
  Hidden: 'purple',
};

export const skill = (name) => ({ name, color: skillColors[name] || 'default' });
