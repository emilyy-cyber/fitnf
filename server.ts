import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { articles as defaultArticles } from './src/data/articles';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body parser size limit to support base64 image uploads
app.use(express.json({ limit: '10mb' }));

const DB_FILE = path.join(process.cwd(), 'db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface Database {
  articles: any[];
  categories: string[];
  settings: {
    logoText: string;
    logoSubtext: string;
    siteTitle: string;
    logoUrl: string;
  };
  stores: any[];
  coupons: any[];
}

function readDb(): Database {
  let db: any;
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json, using defaults:', err);
  }

  const defaultStores = [
    {
      id: 'store-1',
      name: 'Nordstrom',
      slug: 'nordstrom',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Nordstrom_logo.svg',
      description: 'Premium designer apparel, luxury footwear, fine jewelry, beauty products, and homeware.',
      targetUrl: 'https://go.shopmy.us/p-27453061',
      category: 'Fashion',
      featured: true
    },
    {
      id: 'store-2',
      name: 'Zara',
      slug: 'zara',
      logo: 'https://images.unsplash.com/photo-1520004430778-f8389bf0bc34?auto=format&fit=crop&w=120&q=80',
      description: 'Sleek, minimalist fast-fashion garments and timeless modern aesthetics.',
      targetUrl: 'https://www.zara.com',
      category: 'Fashion',
      featured: true
    },
    {
      id: 'store-3',
      name: 'Muji',
      slug: 'muji',
      logo: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=120&q=80',
      description: 'Decelerated lifestyle designs, modular organizational items, and understated apparel.',
      targetUrl: 'https://www.muji.com',
      category: 'Wellness & Home',
      featured: true
    }
  ];

  const defaultCoupons = [
    {
      id: 'coupon-nord-1',
      storeId: 'store-1',
      title: '20% Off Your Order With Code Online Only at Nordstrom',
      discount: '20% OFF',
      type: 'code',
      code: 'NORDYCLUB20',
      description: 'Enjoy an extra 20% off your online order with this limited-time code. Online only at Nordstrom.',
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 8431
    },
    {
      id: 'coupon-nord-2',
      storeId: 'store-1',
      title: "Top Sale! Upto 60% Off Biggest All Womens & Mens Sale at Nordstrom",
      discount: 'UP TO 60% OFF',
      type: 'deal',
      description: "Save up to 60% during the biggest all Women's & Men's apparel and footwear sale at Nordstrom. Active ongoing offer.",
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 9120
    },
    {
      id: 'coupon-nord-3',
      storeId: 'store-1',
      title: '55% Off Sitewide With Code at Nordstrom',
      discount: '55% OFF',
      type: 'code',
      code: 'GET55OFF',
      description: 'Unbelievable sitewide savings! Take 55% off your entire purchase when you apply this coupon code at checkout.',
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 3810
    },
    {
      id: 'coupon-nord-4',
      storeId: 'store-1',
      title: 'Free Gift With Purchase With Code at Nordstrom',
      discount: 'FREE GIFT',
      type: 'code',
      code: 'SUPREME',
      description: 'Receive a luxury exclusive free gift with your qualified purchase. Apply coupon code at checkout.',
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 11420
    },
    {
      id: 'coupon-nord-5',
      storeId: 'store-1',
      title: 'Upto 60% Off All Designer Clearance at Nordstrom',
      discount: 'UP TO 60% OFF',
      type: 'code',
      code: '3394838',
      description: 'Take up to 60% off high-end designer clearance items. Enter code at checkout to claim your savings.',
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 5912
    },
    {
      id: 'coupon-nord-6',
      storeId: 'store-1',
      title: 'Get $60 Off Just In Time For Anniversary Sale at Nordstrom',
      discount: '$60 OFF',
      type: 'deal',
      description: 'Get $60 off your orders just in time for the highly anticipated Nordstrom Anniversary Sale event.',
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 2043
    },
    {
      id: 'coupon-nord-7',
      storeId: 'store-1',
      title: '1% Cash Back for Purchases Sitewide at Nordstrom',
      discount: '1% CASHBACK',
      type: 'deal',
      description: 'Earn 1% cash back on all your purchases sitewide. Activate this deal to lock in your extra savings.',
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 1289
    },
    {
      id: 'coupon-nord-8',
      storeId: 'store-1',
      title: 'Upto 40% Off New Markdowns Sale at Nordstrom',
      discount: 'UP TO 40% OFF',
      type: 'deal',
      description: 'Discover fresh markdowns on shoes, dresses, activewear, and beauty. Save up to 40% instantly without a code.',
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 4202
    },
    {
      id: 'coupon-nord-9',
      storeId: 'store-1',
      title: 'Upto 25% Off Womens & Mens Best Seller Sale at Nordstrom',
      discount: 'UP TO 25% OFF',
      type: 'deal',
      description: "Save up to 25% on the most popular, best-selling styles for women and men at Nordstrom.",
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 3543
    },
    {
      id: 'coupon-nord-10',
      storeId: 'store-1',
      title: 'New Arrivals Under $100 at Nordstrom',
      discount: 'UNDER $100',
      type: 'deal',
      description: 'Browse a curated collection of newly arrived trends and style essentials, all priced under $100.',
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 5120
    },
    {
      id: 'coupon-nord-11',
      storeId: 'store-1',
      title: '50% Off All Womens Sale at Nordstrom',
      discount: '50% OFF',
      type: 'deal',
      description: "Save a flat 50% on selected women's dresses, coats, shoes, handbags, and fine accessories.",
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 6124
    },
    {
      id: 'coupon-nord-12',
      storeId: 'store-1',
      title: 'Earn A $25 Promo Card On $150+ Gift Card At Nordstrom',
      discount: '$25 BONUS',
      type: 'deal',
      description: 'Purchase $150 or more in gift cards online and earn a $25 bonus promotional card to spend later.',
      targetUrl: 'https://go.shopmy.us/p-27453061',
      verified: true,
      usedCount: 1823
    },
    {
      id: 'coupon-zara-1',
      storeId: 'store-2',
      title: 'Get free delivery on your first order at Zara',
      discount: 'FREE SHIP',
      type: 'code',
      code: 'ZARAFREE',
      description: 'Unlock free standard shipping on orders containing new season styles.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 830
    },
    {
      id: 'coupon-zara-2',
      storeId: 'store-2',
      title: 'Flat 15% Off Your First App Order at Zara',
      discount: '15% OFF',
      type: 'code',
      code: 'ZARAAPP15',
      description: 'Download the official Zara app and enter code at checkout to claim 15% off your initial order.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 2450
    },
    {
      id: 'coupon-zara-3',
      storeId: 'store-2',
      title: 'Up to 50% Off Mid-Season Clearance Sale at Zara',
      discount: 'UP TO 50% OFF',
      type: 'deal',
      description: 'Save up to 50% on select outerwear, dresses, knitwear, and accessories during the seasonal markdown event.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 3980
    },
    {
      id: 'coupon-zara-4',
      storeId: 'store-2',
      title: 'Free Shipping on Orders Over $70 at Zara',
      discount: 'FREE SHIP',
      type: 'deal',
      description: 'Shop the latest trends and receive automatic free standard shipping on any purchase of $70 or more.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 5120
    },
    {
      id: 'coupon-zara-5',
      storeId: 'store-2',
      title: 'Zara Home Collection: 20% Off Select Bedding & Decor',
      discount: '20% OFF',
      type: 'deal',
      description: 'Elevate your living space with minimalist sheets, stone-crafted tableware, and linen duvet covers on special pricing.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 1720
    },
    {
      id: 'coupon-zara-6',
      storeId: 'store-2',
      title: 'Exclusive 10% Off Student Discount via Student Beans at Zara',
      discount: '10% OFF',
      type: 'code',
      code: 'ZARASTUDENT10',
      description: 'Verify your student status with Student Beans to instantly unlock a unique 10% discount code.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 1430
    },
    {
      id: 'coupon-zara-7',
      storeId: 'store-2',
      title: 'Zara Military & First Responder Discount: 15% Off',
      discount: '15% OFF',
      type: 'code',
      code: 'ZARAHERO15',
      description: 'Special thank you offer of 15% off for all active military, veterans, healthcare workers, and first responders. Verification required.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 940
    },
    {
      id: 'coupon-zara-8',
      storeId: 'store-2',
      title: 'Save 30% on Timeless Capsule Wardrobe Essentials at Zara',
      discount: '30% OFF',
      type: 'deal',
      description: 'Enjoy up to 30% off high-quality staple shirts, tailored blazers, and classic trousers designed to last.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 2280
    },
    {
      id: 'coupon-zara-9',
      storeId: 'store-2',
      title: 'Free In-Store Returns Within 30 Days at Zara',
      discount: 'FREE RETURN',
      type: 'deal',
      description: 'Enjoy ultimate shopping peace of mind with 100% free and easy returns at any local Zara boutique within 30 days.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 4150
    },
    {
      id: 'coupon-zara-10',
      storeId: 'store-2',
      title: 'Get 10% Off When You Sign Up For Zara Newsletter',
      discount: '10% OFF',
      type: 'code',
      code: 'ZARAJOIN10',
      description: 'Subscribe to the Zara newsletter to receive the latest arrival notifications and a 10% discount code for your next purchase.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 3100
    },
    {
      id: 'coupon-zara-11',
      storeId: 'store-2',
      title: 'Zara Premium Leather Goods: 25% Off Select Boots & Bags',
      discount: '25% OFF',
      type: 'deal',
      description: 'Upgrade your footwear and accessory game with 25% off high-quality real leather boots, loafers, and shoulder bags.',
      targetUrl: 'https://www.zara.com',
      verified: true,
      usedCount: 1650
    },
    {
      id: 'coupon-4',
      storeId: 'store-3',
      title: '15% Off Your Entire Minimalist Homeware Purchase',
      discount: '15% OFF',
      type: 'code',
      code: 'MUJIMIN15',
      description: 'Discover quiet organization solutions. Enter code to save 15%.',
      targetUrl: 'https://www.muji.com',
      verified: true,
      usedCount: 3042
    }
  ];

  if (!db) {
    db = {
      articles: defaultArticles,
      categories: ['Wellness', 'Fashion', 'Travel', 'Culture', 'Lifestyle'],
      settings: {
        logoText: 'LIVING WITH SOUFIA',
        logoSubtext: "Fashion, Lifestyle & Beauty",
        siteTitle: "LIVING WITH SOUFIA — Fashion, Lifestyle & Beauty",
        logoUrl: ''
      },
      stores: defaultStores,
      coupons: defaultCoupons
    };
    writeDb(db);
    return db;
  }

  let changed = false;
  if (!db.articles) {
    db.articles = defaultArticles;
    changed = true;
  } else {
    defaultArticles.forEach(def => {
      if (!db.articles.some((a: any) => a.id === def.id)) {
        db.articles.push(def);
        changed = true;
      }
    });
  }

  if (!db.stores) {
    db.stores = defaultStores;
    changed = true;
  } else {
    defaultStores.forEach(def => {
      if (!db.stores.some((s: any) => s.id === def.id)) {
        db.stores.push(def);
        changed = true;
      }
    });
  }

  if (!db.coupons) {
    db.coupons = defaultCoupons;
    changed = true;
  } else {
    defaultCoupons.forEach(def => {
      if (!db.coupons.some((c: any) => c.id === def.id)) {
        db.coupons.push(def);
        changed = true;
      }
    });
  }

  if (changed) {
    writeDb(db);
  }

  return db;
}

function writeDb(data: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Articles CRUD endpoints
app.get('/api/articles', (req, res) => {
  const db = readDb();
  res.json(db.articles);
});

app.post('/api/articles', (req, res) => {
  try {
    const db = readDb();
    const newArticle = {
      id: Date.now().toString(),
      ...req.body,
      date: req.body.date || new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
      })
    };
    db.articles.unshift(newArticle);
    writeDb(db);
    res.status(201).json(newArticle);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/articles/:id', (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    const index = db.articles.findIndex(a => a.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    db.articles[index] = { ...db.articles[index], ...req.body, id };
    writeDb(db);
    res.json(db.articles[index]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/articles/:id', (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    const initialLength = db.articles.length;
    db.articles = db.articles.filter(a => a.id !== id);
    if (db.articles.length === initialLength) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    writeDb(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Categories API
app.get('/api/categories', (req, res) => {
  const db = readDb();
  res.json(db.categories);
});

app.post('/api/categories', (req, res) => {
  try {
    const db = readDb();
    const { category } = req.body;
    if (!category || typeof category !== 'string') {
      res.status(400).json({ error: 'category name is required' });
      return;
    }
    const trimmed = category.trim();
    if (!db.categories.includes(trimmed)) {
      db.categories.push(trimmed);
      writeDb(db);
    }
    res.status(201).json(db.categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:category', (req, res) => {
  try {
    const db = readDb();
    const { category } = req.params;
    db.categories = db.categories.filter(c => c !== category);
    writeDb(db);
    res.json(db.categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Settings API
app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings);
});

app.post('/api/settings', (req, res) => {
  try {
    const db = readDb();
    db.settings = { ...db.settings, ...req.body };
    writeDb(db);
    res.json(db.settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Stores API
app.get('/api/stores', (req, res) => {
  const db = readDb();
  res.json(db.stores || []);
});

app.post('/api/stores', (req, res) => {
  try {
    const db = readDb();
    const newStore = {
      id: 'store-' + Date.now().toString(),
      ...req.body,
      slug: req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    };
    if (!db.stores) db.stores = [];
    db.stores.push(newStore);
    writeDb(db);
    res.status(201).json(newStore);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/stores/:id', (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    if (!db.stores) db.stores = [];
    const index = db.stores.findIndex(s => s.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    db.stores[index] = { 
      ...db.stores[index], 
      ...req.body, 
      id,
      slug: req.body.name ? req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : db.stores[index].slug
    };
    writeDb(db);
    res.json(db.stores[index]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/stores/:id', (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    if (!db.stores) db.stores = [];
    db.stores = db.stores.filter(s => s.id !== id);
    if (db.coupons) {
      db.coupons = db.coupons.filter(c => c.storeId !== id);
    }
    writeDb(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Coupons API
app.get('/api/coupons', (req, res) => {
  const db = readDb();
  res.json(db.coupons || []);
});

app.post('/api/coupons', (req, res) => {
  try {
    const db = readDb();
    const newCoupon = {
      id: 'coupon-' + Date.now().toString(),
      ...req.body,
      usedCount: req.body.usedCount || 0,
      verified: req.body.verified !== undefined ? req.body.verified : true
    };
    if (!db.coupons) db.coupons = [];
    db.coupons.push(newCoupon);
    writeDb(db);
    res.status(201).json(newCoupon);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/coupons/:id', (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    if (!db.coupons) db.coupons = [];
    const index = db.coupons.findIndex(c => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Coupon not found' });
      return;
    }
    db.coupons[index] = { ...db.coupons[index], ...req.body, id };
    writeDb(db);
    res.json(db.coupons[index]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/coupons/:id', (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    if (!db.coupons) db.coupons = [];
    db.coupons = db.coupons.filter(c => c.id !== id);
    writeDb(db);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coupons/:id/use', (req, res) => {
  try {
    const db = readDb();
    const { id } = req.params;
    if (!db.coupons) db.coupons = [];
    const index = db.coupons.findIndex(c => c.id === id);
    if (index !== -1) {
      db.coupons[index].usedCount = (db.coupons[index].usedCount || 0) + 1;
      writeDb(db);
      res.json(db.coupons[index]);
    } else {
      res.status(404).json({ error: 'Coupon not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Base64 file upload endpoint
app.post('/api/upload', (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      res.status(400).json({ error: 'name and data (base64 string) are required' });
      return;
    }
    const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = path.extname(name) || '.png';
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    
    // Save to local disk for local development if writable
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const filePath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(filePath, buffer);

      const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (fs.existsSync(publicUploadsDir)) {
        fs.writeFileSync(path.join(publicUploadsDir, filename), buffer);
      }
    } catch (fsErr) {
      console.warn('Writing uploaded file to disk failed (expected in read-only platforms):', fsErr);
    }

    const lowerName = (name || '').toLowerCase();
    
    // Curated high-resolution aesthetic Unsplash URLs based on keywords
    const unsplashMap: Record<string, string[]> = {
      nordstrom: [
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
      ],
      shopping: [
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
      ],
      fashion: [
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80'
      ],
      style: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
      ],
      beauty: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
      ],
      skincare: [
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'
      ],
      wellness: [
        'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'
      ],
      travel: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'
      ],
      culture: [
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=800&q=80'
      ],
      lifestyle: [
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'
      ],
      avatar: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
      ],
      author: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
      ],
      logo: [
        'https://images.unsplash.com/photo-1520004430778-f8389bf0bc34?auto=format&fit=crop&w=300&q=80'
      ]
    };

    let selectedUrls: string[] = [];
    for (const key of Object.keys(unsplashMap)) {
      if (lowerName.includes(key)) {
        selectedUrls = unsplashMap[key];
        break;
      }
    }

    // Default fallback is the elegant fashion list
    let finalUrl = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80';
    if (selectedUrls.length > 0) {
      const randomIndex = Math.floor(Math.random() * selectedUrls.length);
      finalUrl = selectedUrls[randomIndex];
    } else {
      // Pick a random general lifestyle/fashion image
      const allChoices = [
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80'
      ];
      finalUrl = allChoices[Math.floor(Math.random() * allChoices.length)];
    }

    res.json({ url: finalUrl });
  } catch (err: any) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

// API: AURA AI Editorial Article Generator
app.post('/api/generate-article', async (req, res) => {
  const { topic, category } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const defaultUnsplashImages: Record<string, string[]> = {
    'Wellness': [
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80'
    ],
    'Fashion': [
      'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80'
    ],
    'Travel': [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80'
    ],
    'Culture': [
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=1200&q=80'
    ],
    'Lifestyle': [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520004430778-f8389bf0bc34?auto=format&fit=crop&w=1200&q=80'
    ]
  };

  const selectedCategory = category || 'Lifestyle';
  const categoryImages = defaultUnsplashImages[selectedCategory] || defaultUnsplashImages['Lifestyle'];
  const fallbackImage = categoryImages[Math.floor(Math.random() * categoryImages.length)];

  // Fallback article generator when API key is missing or simulated fallback
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY is missing. Generating simulated fallback article.');
    setTimeout(() => {
      res.json({
        title: `The Decelerated Art of ${topic || 'Somatic Living'}`,
        subtitle: `How conscious presence and refined ${selectedCategory.toLowerCase()} elevate our everyday routines.`,
        summary: `An intellectual investigation into the slow ${selectedCategory.toLowerCase()} movement, showcasing how mindful pauses and material authenticity restore focus.`,
        category: selectedCategory,
        content: [
          `In a hyper-accelerated era, our daily experiences are often reduced to transaction and metric optimization. The beauty of ${topic || 'Somatic Living'} lies not in doing things faster, but in doing them with a profound sense of temporal awareness and physical resonance. By stripping away extraneous distractions, we create a quiet container for our minds to wander and heal.`,
          `When we examine the material touchpoints of our environment—from the grain of the wood under our hands to the soft drape of organic linen—we re-establish an authentic relationship with our physical world. Deceleration is the ultimate luxury. It demands our complete attention, inviting us to find depth in the ordinary.`,
          `As we step forward, let us embrace this decelerated lifestyle with intention. Designating screen-free hours, practicing conscious breathing, and choosing beautifully crafted, sustainable tools are small but revolutionary acts of self-compassion that align our inner selves with the natural rhythms of life.`
        ],
        image: fallbackImage,
        readTime: '5 min read',
        author: {
          name: 'AURA Editorial',
          role: 'AI Literary Companion',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80'
        }
      });
    }, 1500);
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Write a premium, highly sophisticated, and poetically minded lifestyle article for ÉLOQUENCE Magazine.
The article should be about the following topic: "${topic || 'Somatic Stillness and Slow Living'}".
The selected category is: "${selectedCategory}".

Provide your response strictly as a JSON object with the following fields:
1. "title": A sophisticated, striking, short title (e.g., "The Architecture of Stillness").
2. "subtitle": An elegant subtitle expanding on the concept (e.g., "How minimalist design shapes our cognitive peace").
3. "summary": A compelling, poetic 2-3 sentence abstract summarizing the piece.
4. "category": Either Wellness, Fashion, Travel, Culture, or Lifestyle.
5. "content": An array of exactly 3 beautiful, deeply literary paragraphs. Write in high-end, elegant prose.
6. "image": Choose ONE of the following highly curated, valid Unsplash URLs that matches the topic best:
${categoryImages.map(img => `- ${img}`).join('\n')}
7. "readTime": Estimated read time (e.g. "5 min read").

Your writing style must be intellectual, serene, and warm. Avoid any generic chatbot clichés or marketing jargon.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.85,
      }
    });

    const text = response.text || "{}";
    const articleData = JSON.parse(text);
    
    // Ensure author block is appended
    articleData.author = {
      name: 'AURA AI',
      role: 'AI Literary Editor',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80'
    };

    if (!articleData.image) {
      articleData.image = fallbackImage;
    }

    res.json(articleData);
  } catch (err: any) {
    console.error('Error generating AI article:', err);
    res.status(500).json({ error: 'Failed to generate elegant article: ' + err.message });
  }
});

// API: AURA AI Editorial Assistant Proxy
app.post('/api/assistant', async (req, res) => {
  const { articleTitle, articleContent, userMessage, chatHistory } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!userMessage) {
    res.status(400).json({ error: 'userMessage is required' });
    return;
  }

  // Handle missing Gemini API Key gracefully as instructed
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn('GEMINI_API_KEY environment variable is missing. Running in simulated fallback mode.');
    
    // Simulate a highly elegant editorial response based on the article context
    setTimeout(() => {
      let simulatedReply = '';
      const promptLower = userMessage.toLowerCase();

      if (promptLower.includes('summar') || promptLower.includes('short') || promptLower.includes('brief')) {
        simulatedReply = `### Abstract: *${articleTitle || 'Selected Dossier'}*\n\nThis article examines the intersections of material structure and human awareness. It advocates for deliberate deceleration and the cultivation of **physical and cognitive stillness** to counteract modern sensory saturation.\n\n*Key takeaways:*\n1. **Material Authenticity**: Surrounding ourselves with unvarnished, raw textures helps ground our cognitive processes.\n2. **Temporal Boundaries**: Intentionally defining screens-free pockets of our day lets the brain return to its natural default mode state.\n3. **Decelerated Awareness**: Deceleration of our sensory rhythms is the ultimate luxury in our hyper-connected decade.\n\n*(Note: This is an offline preview summary. Configure your \`GEMINI_API_KEY\` to enable dynamic, conversational interactions with AURA.)*`;
      } else if (promptLower.includes('poem') || promptLower.includes('haiku') || promptLower.includes('verse')) {
        simulatedReply = `### A Verse in Shadows\n\n*The stone remains, unvarnished, deep,*\ *A quiet watch the shadows keep.*\ *In corners where the blue light dies,*\ *The ancient, silent truths arise.*\ \n\n*A single cup, a breath, a lane,*\ *The healing wash of twilight rain.*\ *We fade into the quiet room,*\ *To trace the rhythm of the loom.*\n\n*(Note: This is an offline preview poetic rendering. Configure your \`GEMINI_API_KEY\` in the Secrets panel to unleash AURA's full creative capability.)*`;
      } else {
        simulatedReply = `### Greeting from AURA\n\nThank you for exploring *${articleTitle || 'ÉLOQUENCE Journal'}*. You asked: *"${userMessage}"*\n\nAs your literary companion, I am designed to dive deep into the cultural, architectural, and philosophical roots of this piece. \n\n**To unlock my fully dynamic, real-time Gemini AI capabilities, please add your \`GEMINI_API_KEY\` via the Secrets panel in the AI Studio UI.** Once configured, I will generate bespoke, contextual discourse on slow design, poetry, and mindfulness.\n\nMeanwhile, reflecting on this essay, consider how the **beauty of tactile imperfections** (such as hand-crafted stoneware or raw concrete) invites us to accept our own human vulnerability. In what ways can you introduce a "pause" in your immediate surroundings today?`;
      }
      
      res.json({ text: simulatedReply, simulated: true });
    }, 1000);
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    // Build context-rich prompt
    let systemInstruction = `You are AURA, the premium, highly sophisticated, and poetically minded AI Literary Assistant of ÉLOQUENCE Magazine.
Your personality is intellectual, thoughtful, serene, and warm. You speak with high-end editorial elegance, avoiding technical jargon, standard chatbot phrases, or marketing hype. You use precise design and philosophical terminology when relevant.
You are conversing with a reader about the article titled "${articleTitle || 'Éloquence Dossier'}".

Here is the full text of the article for your context:
"""
${Array.isArray(articleContent) ? articleContent.join('\n\n') : (articleContent || 'An elegant lifestyle dossier.')}
"""

Guidelines:
1. Always maintain your high-end literary persona.
2. Structure your responses beautifully with elegant Markdown formatting (headings, italics, bullet points).
3. Be brief yet profound—do not ramble.
4. If asked to summarize, provide a gorgeous, structured abstract.
5. You can write poetry, offer wellness tips, discuss architectural philosophy, and recommend slow travel itineraries inspired by the article.
6. Address the reader directly with quiet warmth.`;

    // Construct standard generative content
    const contents: any[] = [];
    
    // Add chat history if present to enable continuous conversations
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach(item => {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }]
        });
      });
    }
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    const textResponse = aiResponse.text || "AURA is pausing to gather thoughts. Please try asking again.";
    res.json({ text: textResponse, simulated: false });

  } catch (err: any) {
    console.error('Error in Gemini Assistant proxy API:', err);
    res.status(500).json({ error: 'AURA assistant service experienced a minor interruption: ' + err.message });
  }
});

// Setup Vite Dev Server / Static Asset Serving
async function startServer() {
  if (process.env.VERCEL) {
    console.log('Running on Vercel - exporting app serverless handler.');
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted for development.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static build from dist folder.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ÉLOQUENCE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

export default app;
