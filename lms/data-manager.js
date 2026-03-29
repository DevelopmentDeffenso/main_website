/**
 * DEFFENSO LMS — DATA MANAGER (PROD READY)
 * Handles abstraction between Local (Legacy) and Firebase (Production) data layers.
 */

const DataManager = {
  isFirestore() {
    return typeof window.db !== 'undefined' && window.auth.currentUser;
  },

  async waitForAuth() {
    if (!window.auth) return null;
    if (window.auth.currentUser) return window.auth.currentUser;
    return new Promise(resolve => {
      const unsub = window.auth.onAuthStateChanged(user => { unsub(); resolve(user); });
    });
  },

  // --- USERS ---
  async getProfile() {
    if (this.isFirestore()) {
      const user = window.auth.currentUser;
      const doc = await window.db.collection('users').doc(user.uid).get();
      return doc.exists ? doc.data() : null;
    } else {
      // Legacy Local Logic
      const sess = sessionStorage.getItem('dflms_session');
      return JSON.parse(sess || '{}');
    }
  },

  // --- COURSES ---
  async getCourses() {
    if (this.isFirestore()) {
      const snapshot = await window.db.collection('courses').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Legacy Local Logic
      return JSON.parse(localStorage.getItem('dflms_courses') || '[]');
    }
  },

  // --- PROGRESS ---
  async getProgress() {
    if (this.isFirestore()) {
      const user = window.auth.currentUser;
      const doc = await window.db.collection('progress').doc(user.uid).get();
      return doc.exists ? doc.data() : {};
    } else {
      // Legacy Local Logic
      return JSON.parse(localStorage.getItem('dflms_progress') || '{}');
    }
  },

  async saveProgress(videoId, data) {
    if (this.isFirestore()) {
      const user = window.auth.currentUser;
      await window.db.collection('progress').doc(user.uid).set({
        [videoId]: {
          ...data,
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        }
      }, { merge: true });
    } else {
      // Legacy Local Logic
      const p = await this.getProgress();
      const userKey = (vId) => `${JSON.parse(sessionStorage.getItem('dflms_session')).id}_${vId}`;
      p[userKey(videoId)] = data;
      localStorage.setItem('dflms_progress', JSON.stringify(p));
    }
  },

  // --- AUTH ---
  async login(email, password) {
    if (typeof window.auth !== 'undefined') {
      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Fetch profile for role
      let profile = await this.getProfile();
      if (!profile) {
        profile = { email: user.email, role: 'student', created_at: firebase.firestore.FieldValue.serverTimestamp() };
        await window.db.collection('users').doc(user.uid).set(profile);
      }
      const session = { id: user.uid, email: user.email, role: profile.role };
      sessionStorage.setItem('dflms_session', JSON.stringify(session));
      return session;
    } else {
      throw new Error('Firebase Auth not initialized');
    }
  },

  async logout() {
    if (typeof window.auth !== 'undefined') {
      await window.auth.signOut();
    }
    sessionStorage.removeItem('dflms_session');
    window.location.href = 'login.html';
  }
};

window.DataManager = DataManager;
