// Database cleanup and proper migration
const Database = require('better-sqlite3');
const crypto = require('crypto');

console.log('🧹 CLEANING UP DATABASE...');
const db = new Database('./database.db');

// First, let's see what's currently in the database
console.log('\n📊 Current state:');
const currentCategories = db.prepare('SELECT COUNT(*) as count FROM reel_categories').get();
const currentTypes = db.prepare('SELECT COUNT(*) as count FROM reel_types').get();
console.log(`Categories: ${currentCategories.count}, Types: ${currentTypes.count}`);

// Clear existing reel data to start fresh
console.log('\n🗑️  Clearing existing reel data...');
db.prepare('DELETE FROM reel_types').run();
db.prepare('DELETE FROM reel_categories').run();

// Define clean, organized categories
const categories = [
  {
    name: 'viral',
    title: 'Viral Content',
    description: 'High-engagement content designed to go viral',
    icon: 'TrendingUp'
  },
  {
    name: 'proverbs',
    title: 'Wisdom & Proverbs',
    description: 'Timeless wisdom and life lessons',
    icon: 'Brain'
  },
  {
    name: 'anime',
    title: 'Anime Content',
    description: 'Anime-related content and theories',
    icon: 'Sparkles'
  },
  {
    name: 'asmr',
    title: 'ASMR Content',
    description: 'Relaxing and satisfying ASMR content',
    icon: 'Volume2'
  }
];

// Define clean reel types with proper URLs
const reelTypes = [
  // Viral category
  {
    category_name: 'viral',
    name: 'gym-motivation',
    title: 'Gym Motivation',
    description: 'Motivational content for fitness enthusiasts',
    icon: 'Dumbbell',
    message: 'Gym motivation reel generated successfully!',
    caption: 'Get motivated and crush your fitness goals! 💪 #GymMotivation #Fitness #Workout',
    external_url: 'https://api.example.com/generate/gym-motivation',
    status_url: 'https://api.example.com/status',
    posting_url: 'https://api.example.com/post'
  },
  {
    category_name: 'viral',
    name: 'war-motivation',
    title: 'War Motivation',
    description: 'Strategic wisdom and motivational war-themed content',
    icon: 'Sword',
    message: 'War motivation reel generated successfully!',
    caption: 'Tactical wisdom from the greatest strategists ⚔️ #WarWisdom #Strategy #Motivation',
    external_url: 'https://api.example.com/generate/war-motivation',
    status_url: 'https://api.example.com/status',
    posting_url: 'https://api.example.com/post'
  },
  
  // Anime category
  {
    category_name: 'anime',
    name: 'theory',
    title: 'Anime Theory',
    description: 'Deep dive into anime theories and character analysis',
    icon: 'Brain',
    message: 'Anime theory reel generated successfully!',
    caption: 'Mind-blowing anime theories and analysis 🧠 #Anime #Theory #Analysis',
    external_url: 'https://n8n.nutrador.com/webhook-test/d1eb881a-33e3-4051-ba1f-1a1f31ba8b69',
    status_url: 'https://n8n.nutrador.com/webhook-test/status',
    posting_url: 'https://api.example.com/post'
  },
  
  // Proverbs category
  {
    category_name: 'proverbs',
    name: 'wisdom',
    title: 'Wisdom',
    description: 'Timeless wisdom and life lessons',
    icon: 'BookOpen',
    message: 'Wisdom reel generated successfully!',
    caption: 'Ancient wisdom for modern times 🧠 #Wisdom #Proverbs #LifeLessons',
    external_url: 'https://api.example.com/generate/wisdom',
    status_url: 'https://api.example.com/status',
    posting_url: 'https://api.example.com/post'
  },
  
  // ASMR category
  {
    category_name: 'asmr',
    name: 'food',
    title: 'ASMR Food',
    description: 'Satisfying food-related ASMR content',
    icon: 'UtensilsCrossed',
    message: 'ASMR food reel generated successfully!',
    caption: 'Satisfying food sounds and visuals 🍽️ #ASMR #Food #Satisfying #Relaxing',
    external_url: 'https://api.example.com/generate/asmr-food',
    status_url: 'https://api.example.com/status',
    posting_url: 'https://api.example.com/post'
  }
];

console.log('\n✨ Creating clean categories...');
const insertCategoryStmt = db.prepare(`
  INSERT INTO reel_categories (id, name, title, description, icon, is_active)
  VALUES (?, ?, ?, ?, ?, 1)
`);

const categoryIds = {};
categories.forEach(category => {
  const id = crypto.randomUUID();
  categoryIds[category.name] = id;
  insertCategoryStmt.run(id, category.name, category.title, category.description, category.icon);
  console.log(`✓ ${category.name}: ${category.title}`);
});

console.log('\n🎯 Creating clean reel types...');
const insertTypeStmt = db.prepare(`
  INSERT INTO reel_types (
    id, category_id, name, title, description, icon, message, caption,
    external_url, status_url, posting_url, is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

reelTypes.forEach(type => {
  const id = crypto.randomUUID();
  const categoryId = categoryIds[type.category_name];
  insertTypeStmt.run(
    id, categoryId, type.name, type.title, type.description, type.icon,
    type.message, type.caption, type.external_url, type.status_url, type.posting_url
  );
  console.log(`✓ ${type.name}: ${type.title} → ${type.external_url}`);
});

console.log('\n📈 Final state:');
const finalCategories = db.prepare('SELECT COUNT(*) as count FROM reel_categories').get();
const finalTypes = db.prepare('SELECT COUNT(*) as count FROM reel_types').get();
console.log(`Categories: ${finalCategories.count}, Types: ${finalTypes.count}`);

console.log('\n🎯 Sample data:');
const sampleTypes = db.prepare(`
  SELECT rt.name, rt.title, rt.external_url, rc.name as category
  FROM reel_types rt
  JOIN reel_categories rc ON rt.category_id = rc.id
  ORDER BY rc.name, rt.name
`).all();

sampleTypes.forEach(type => {
  console.log(`- ${type.category}/${type.name}: ${type.title} → ${type.external_url}`);
});

db.close();
console.log('\n✅ Database cleanup completed!');
