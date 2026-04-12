# Voice-Activated Secondary Display Feature Plan

**Feature Name:** Multi-Language Voice Recognition with Secondary Display Promotions  
**Created:** March 8, 2026  
**Status:** Planning Phase  
**Estimated Timeline:** 2-3 weeks

---

## 🎯 Feature Overview

Implement a voice-activated system that:

- Listens to customer queries in multiple Indian languages (Hindi, English, Hinglish)
- Detects product names mentioned by customers
- Displays relevant active promotions on a secondary monitor/display
- Filters out casual conversation to prevent false triggers
- Shows dynamic promotional content with product images, pricing, and discounts

---

## 🏗️ Architecture Components

### 1. **Secondary Display Window** (Electron Multi-Window)

- Create separate BrowserWindow for external display
- Auto-detect and position on secondary monitor
- Full-screen promotional display
- Real-time updates via IPC communication

### 2. **Voice Recognition System** (Web Speech API)

- Multi-language support (Hindi, English, Tamil, Telugu, Marathi)
- Continuous listening with confidence threshold (>70%)
- Hinglish (mixed Hindi-English) support
- Trigger word detection for query activation

### 3. **Smart Filtering Layer**

- Confidence threshold filtering (70%+ required)
- Trigger word detection ("चाहिए", "price", "kitna", "chahiye", "दो")
- Product name pre-validation against cached inventory
- Rate limiting (5-second cooldown between queries)
- Prevents false triggers from casual conversation

### 4. **Database Schema Updates**

- Add multi-language product name fields
- Add searchKeywords field for fuzzy matching
- Support Hindi, Tamil, and local language names

### 5. **Backend Voice Search API**

- Fuzzy keyword matching across languages
- Active promotion filtering
- Product-promotion relationship queries
- Optimized search with in-memory caching

### 6. **Display Component**

- Full-screen promotional cards
- Product images, pricing, discount percentages
- Auto-rotate multiple promotions
- Idle screen when no active promotion
- 30-second display duration per promotion

---

## 📋 Implementation Phases

### **Phase 1: Secondary Display Setup** (2-3 hours)

**Tasks:**

- [ ] Modify `desktop/main.js` to support multiple windows
- [ ] Add screen detection for external displays
- [ ] Create IPC handlers for display window management
- [ ] Add toggle button in main POS interface
- [ ] Test multi-monitor positioning logic

**Files to Modify:**

- `desktop/main.js`
- `desktop/preload.js`

**Deliverables:**

- Secondary window opens on external display
- Can be toggled on/off from POS interface
- Proper cleanup on window close

---

### **Phase 2: Database Schema Extension** (1-2 hours)

**Tasks:**

- [ ] Add `nameHindi`, `nameTamil`, `nameLocal` fields to Product model
- [ ] Add `searchKeywords` field (comma-separated for fuzzy matching)
- [ ] Create Prisma migration
- [ ] Update seed data with sample Hindi/English keywords
- [ ] Add API endpoint to fetch product names for caching

**Schema Changes:**

```prisma
model Product {
  id                     Int      @id @default(autoincrement())
  name                   String   // English name
  nameHindi              String?  // हिंदी नाम
  nameTamil              String?  // தமிழ் பெயர்
  nameLocal              String?  // Local language
  searchKeywords         String?  // "maggi,मैगी,noodles,instant,2min"
  // ... existing fields
}
```

**Files to Modify:**

- `server/prisma/schema.prisma`
- `server/seed.js`

**Deliverables:**

- Migration applied successfully
- Sample products with multi-language names
- Product cache API endpoint

---

### **Phase 3: Voice Recognition Component** (3-4 hours)

**Tasks:**

- [ ] Create `VoiceListener.jsx` component
- [ ] Implement Web Speech API integration
- [ ] Add language selector (Hindi/English/Hinglish)
- [ ] Implement confidence threshold filtering (70%+)
- [ ] Add trigger word detection system
- [ ] Implement product name pre-validation
- [ ] Add rate limiting (5-second cooldown)
- [ ] Create UI controls (start/stop listening, language selector)
- [ ] Add visual feedback for listening state
- [ ] Implement product cache loading on mount

**Trigger Words List:**

```javascript
const TRIGGER_WORDS = [
  // Hindi
  'चाहिए',
  'chahiye',
  'दो',
  'do',
  'देना',
  'dena',
  'कितना',
  'kitna',
  'कितने',
  'kitne',
  // English
  'price',
  'rate',
  'cost',
  'how much',
  'sale',
  'offer',
  'discount',
  'promo',
  'want',
  'need',
  'give',
  'show',
];
```

**Files to Create:**

- `client/src/components/POS/VoiceListener.jsx`
- `client/src/hooks/useVoiceRecognition.js`

**Files to Modify:**

- `client/src/components/POS/POSInterface.jsx` (integrate VoiceListener)

**Deliverables:**

- Voice recognition with multi-language support
- Smart filtering prevents false triggers
- Visual feedback for listening state
- Language switcher working

---

### **Phase 4: Backend Voice Search API** (2-3 hours)

**Tasks:**

- [ ] Create voice search endpoint `/api/promotions/voice-search`
- [ ] Implement fuzzy keyword matching algorithm
- [ ] Add multi-language field searching
- [ ] Filter only active promotions (within date range)
- [ ] Add product name caching endpoint `/api/products/names`
- [ ] Implement result ranking (best match first)
- [ ] Add logging for voice queries (analytics)
- [ ] Handle edge cases (no match, multiple matches)

**Matching Algorithm:**

```javascript
// Extract keywords from voice input
// Search across: name, nameHindi, searchKeywords
// Match minimum 3-character words
// Return promotions with matching products
// Sort by relevance (direct match > partial match)
```

**Files to Create:**

- `server/src/services/voice-search.service.js`

**Files to Modify:**

- `server/src/controllers/promotion.controller.js`
- `server/src/routes/promotion.routes.js`
- `server/src/controllers/product.controller.js`
- `server/src/routes/product.routes.js`

**Deliverables:**

- Voice search API endpoint functional
- Product names cache endpoint
- Accurate fuzzy matching working
- Logs voice queries for debugging

---

### **Phase 5: Display Screen Component** (3-4 hours)

**Tasks:**

- [ ] Create `PromotionDisplay.jsx` component
- [ ] Design full-screen promotional card layout
- [ ] Add product image display
- [ ] Show original price, promo price, discount percentage
- [ ] Implement auto-clear timer (30 seconds)
- [ ] Create idle/default screen (when no promotion active)
- [ ] Add smooth transitions between promotions
- [ ] Create display route `/display` in React Router
- [ ] Handle multiple products in single promotion
- [ ] Add carousel for multiple promotions
- [ ] Style for high visibility (large fonts, bright colors)

**Display Layout:**

```
┌─────────────────────────────────────┐
│                                     │
│  🎯 SPECIAL OFFER!                 │
│                                     │
│     [Product Image]                │
│                                     │
│     MAGGI 2-MIN NOODLES            │
│                                     │
│     ₹14  →  ₹12                    │
│     ────────────                   │
│      14% OFF!                      │
│                                     │
└─────────────────────────────────────┘
```

**Files to Create:**

- `client/src/components/Display/PromotionDisplay.jsx`
- `client/src/components/Display/PromotionCard.jsx`
- `client/src/components/Display/IdleScreen.jsx`
- `client/src/pages/DisplayPage.jsx`

**Files to Modify:**

- `client/src/App.jsx` (add /display route)
- `desktop/preload.js` (add IPC handlers for display updates)

**Deliverables:**

- Full-screen promotional display
- Auto-refresh and auto-clear working
- Beautiful, high-visibility design
- Idle screen when inactive

---

### **Phase 6: IPC Communication Layer** (1-2 hours)

**Tasks:**

- [ ] Add IPC handler for display updates
- [ ] Implement `updateDisplay(promotionData)` method
- [ ] Add listener in display window `onDisplayUpdate`
- [ ] Handle window-to-window communication
- [ ] Add error handling for missing display window
- [ ] Implement queue system for rapid-fire updates

**Files to Modify:**

- `desktop/main.js`
- `desktop/preload.js`

**Deliverables:**

- Main window can send promotion data to display window
- Display window receives and renders promotions
- Graceful handling if display window closed

---

### **Phase 7: UI/UX Integration** (2 hours)

**Tasks:**

- [ ] Add voice control panel to POS interface
- [ ] Add "Secondary Display" toggle button in settings
- [ ] Show real-time listening status indicator
- [ ] Display last detected voice query (for debugging)
- [ ] Add language selector dropdown
- [ ] Show active promotions count
- [ ] Add manual "Show Promotion" button (fallback)
- [ ] Create settings panel for voice feature

**Integration Points:**

- POS main screen: Small voice control widget
- Settings page: Full voice feature configuration
- Dashboard: Voice query analytics

**Files to Modify:**

- `client/src/components/POS/POSInterface.jsx`
- `client/src/components/Settings/SettingsPage.jsx`
- `client/src/components/Dashboard/Dashboard.jsx`

**Deliverables:**

- Voice controls integrated seamlessly
- Settings for voice feature configuration
- Visual feedback for all states

---

### **Phase 8: Testing & Optimization** (3-4 hours)

**Tasks:**

- [ ] Test with real Hindi/Hinglish phrases
- [ ] Test with background noise (shop environment)
- [ ] Verify false trigger prevention
- [ ] Test rate limiting effectiveness
- [ ] Performance testing (query response time)
- [ ] Test on Windows, macOS, Linux
- [ ] Test with different microphone quality
- [ ] Test multi-monitor detection on various setups
- [ ] Load testing (concurrent voice queries)
- [ ] User acceptance testing with actual cashiers

**Test Scenarios:**

```
1. Customer says "मैगी कितने का है?" → Shows Maggie promotion
2. Customer says "Britannia biscuit chahiye" → Shows biscuit promotion
3. Casual conversation → No false triggers
4. Rapid consecutive queries → Rate limiting works
5. Low confidence speech → Ignored correctly
6. Unknown product → No display update
7. Multiple products mentioned → Shows first match
8. Display window closed mid-query → Graceful handling
```

**Deliverables:**

- All test scenarios passing
- Performance benchmarks documented
- Known issues documented

---

## 🛠️ Technical Requirements

### **Hardware:**

- USB microphone (₹500-2000) or built-in laptop mic
- Secondary monitor/TV with HDMI connection
- Windows/macOS/Linux system with dual display support

### **Software Dependencies:**

- No new npm packages required (Web Speech API is native)
- Existing Electron and React stack sufficient

### **Browser Compatibility:**

- Web Speech API supported in Chromium (Electron uses Chromium)
- Requires HTTPS or localhost (Electron provides this)

---

## 🔒 Smart Filtering Strategy

To prevent false triggers from casual conversation, implement **4-layer filtering**:

### Layer 1: Confidence Threshold

- Only process speech with 70%+ confidence
- Reject unclear or mumbled speech

### Layer 2: Trigger Word Detection

- Require purchase-intent keywords
- Hindi: चाहिए, कितना, दो
- English: price, want, show, cost

### Layer 3: Product Name Validation

- Check against cached product inventory
- Minimum 3-character match required
- Fuzzy matching with known product names

### Layer 4: Rate Limiting

- 5-second cooldown between queries
- Prevents continuous triggering
- Reduces database load

**Expected False Positive Rate:** <5% with all filters active

---

## 🌐 Multi-Language Support

### Primary Languages:

- **Hindi (hi-IN):** Primary for North India
- **English (en-IN):** Educated customers
- **Hinglish:** Mixed Hindi-English (most common)

### Future Expansion:

- Tamil (ta-IN)
- Telugu (te-IN)
- Marathi (mr-IN)
- Bengali (bn-IN)

### Implementation:

```javascript
// Language detection and switching
const languages = [
  { code: 'hi-IN', label: 'हिंदी (Hindi)' },
  { code: 'en-IN', label: 'English' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
];
```

---

## 📊 Success Metrics

### Performance Metrics:

- Voice query response time: <500ms
- Display update latency: <200ms
- False positive rate: <5%
- Product match accuracy: >85%

### Business Metrics:

- Increase in promotion awareness
- Reduction in customer questions
- Faster transaction times
- Improved customer engagement

---

## 🚀 Deployment Plan

### Development Environment:

1. Test on single machine with virtual secondary display
2. Validate voice recognition with sample audio
3. Test with actual Hindi/English phrases

### Staging:

1. Deploy to test store with actual dual monitors
2. Train cashiers on voice controls
3. Collect feedback on accuracy

### Production:

1. Roll out to primary store
2. Monitor error logs and false triggers
3. Adjust trigger words and thresholds based on real data
4. Expand to other stores after 2-week validation

---

## 🐛 Known Challenges & Solutions

### Challenge 1: Background Noise

**Problem:** Shop noise may interfere with voice recognition  
**Solution:** Use directional USB microphone at counter, adjust confidence threshold

### Challenge 2: Accents & Dialects

**Problem:** Regional accents may affect recognition accuracy  
**Solution:** Use broad searchKeywords, fuzzy matching, multiple language fields

### Challenge 3: Simultaneous Conversations

**Problem:** Multiple people talking at once  
**Solution:** Position microphone close to cashier, use trigger words

### Challenge 4: Old Product Names

**Problem:** Customers use old/slang names for products  
**Solution:** Add common aliases to searchKeywords field

### Challenge 5: Display Not Connected

**Problem:** Secondary monitor disconnected during operation  
**Solution:** Graceful fallback, show error message, continue POS operation

---

## 📝 Configuration Options

### Voice Settings (Admin Configurable):

- **Language:** Hindi/English/Auto-detect
- **Confidence Threshold:** 60-90% (default: 70%)
- **Rate Limit:** 3-10 seconds (default: 5s)
- **Display Duration:** 10-60 seconds (default: 30s)
- **Trigger Words:** Customizable list
- **Enable/Disable Voice:** Master toggle

### Display Settings:

- **Auto-fullscreen:** On/Off
- **Idle Screen Message:** Customizable
- **Font Size:** Small/Medium/Large
- **Theme:** Light/Dark/Auto

---

## 🔄 Future Enhancements

### Phase 2 Features (Post-MVP):

1. **Push Notifications:** Show promotions even when no voice trigger
2. **Video Playback:** Play promotional videos on idle screen
3. **QR Code Display:** Let customers scan for details
4. **Multi-Product Carousel:** Rotate multiple promotions automatically
5. **Customer Analytics:** Track which products customers ask about most
6. **Voice Commands:** "Next", "Previous", "More details"
7. **Bluetooth Speaker:** Text-to-speech price announcements
8. **Cloud Speech API:** Better accuracy with Google/Azure Speech
9. **Offline Mode:** Local speech recognition without internet
10. **Mobile App:** Control display from phone

---

## 📚 Documentation Requirements

### Developer Documentation:

- [ ] API documentation for voice search endpoint
- [ ] IPC communication protocol documented
- [ ] Voice filtering algorithm explained
- [ ] Display component usage guide

### User Documentation:

- [ ] Cashier training guide (with screenshots)
- [ ] Voice commands cheat sheet (Hindi + English)
- [ ] Troubleshooting guide (microphone issues, display issues)
- [ ] Admin configuration guide

### Technical Documentation:

- [ ] Architecture diagram
- [ ] Data flow diagram
- [ ] Sequence diagram for voice → display flow
- [ ] Database schema changes documented

---

## ✅ Definition of Done

Feature is considered complete when:

- ✅ Secondary display opens on external monitor automatically
- ✅ Voice recognition works in Hindi and English
- ✅ False triggers are <5% with smart filtering
- ✅ Promotions display correctly with images and pricing
- ✅ Rate limiting prevents query spam
- ✅ All test scenarios pass
- ✅ Cashier can toggle voice recognition on/off
- ✅ System works on Windows and macOS
- ✅ Documentation is complete
- ✅ User acceptance testing passed by actual cashiers

---

## 🎯 Next Steps

1. **Immediate:** Review this plan and approve/modify
2. **Day 1-2:** Implement Phase 1 (Secondary Display)
3. **Day 3-4:** Implement Phase 2 (Database Schema) + Phase 3 (Voice Recognition)
4. **Day 5-6:** Implement Phase 4 (Backend API) + Phase 5 (Display Component)
5. **Day 7:** Implement Phase 6 (IPC) + Phase 7 (UI Integration)
6. **Day 8-10:** Phase 8 (Testing & Optimization)
7. **Day 11-14:** User training and deployment

---

## 💡 Questions to Resolve

1. Which languages are most important for your customer base?
2. Do you have a secondary monitor/TV available for testing?
3. What type of microphone will you use (USB/built-in)?
4. Should voice feature be always-on or manually activated?
5. Do you want to track voice queries for analytics?
6. Should promotions auto-rotate even without voice trigger?
7. What should idle screen show (logo, store info, generic promotions)?

---

**End of Feature Plan**

_This document will be updated as implementation progresses._
