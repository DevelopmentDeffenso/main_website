/**
 * DEFFENSO LMS — DATA MANAGER (PROD READY)
 * Handles abstraction between Local (Legacy) and Firebase (Production) data layers.
 */

const DataManager = {
  isFirestore() {
    return typeof window.db !== 'undefined' && window.auth && window.auth.currentUser;
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
      return JSON.parse(localStorage.getItem('dflms_courses') || '[]');
    }
  },

  async saveCourse(course) {
    if (this.isFirestore()) {
      const docRef = course.id
        ? window.db.collection('courses').doc(course.id)
        : window.db.collection('courses').doc();
      const data = { ...course };
      if (!course.id) data.id = docRef.id;
      data.updated_at = firebase.firestore.FieldValue.serverTimestamp();
      await docRef.set(data, { merge: true });
      return data.id || docRef.id;
    } else {
      const courses = JSON.parse(localStorage.getItem('dflms_courses') || '[]');
      const idx = courses.findIndex(c => c.id === course.id);
      if (idx >= 0) {
        courses[idx] = { ...courses[idx], ...course };
      } else {
        courses.push(course);
      }
      localStorage.setItem('dflms_courses', JSON.stringify(courses));
      return course.id;
    }
  },

  async deleteCourse(courseId) {
    if (this.isFirestore()) {
      await window.db.collection('courses').doc(courseId).delete();
    } else {
      const courses = JSON.parse(localStorage.getItem('dflms_courses') || '[]').filter(c => c.id !== courseId);
      localStorage.setItem('dflms_courses', JSON.stringify(courses));
    }
  },

  // --- PROGRESS ---
  async getProgress() {
    if (this.isFirestore()) {
      const user = window.auth.currentUser;
      const doc = await window.db.collection('progress').doc(user.uid).get();
      return doc.exists ? doc.data() : {};
    } else {
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
      const p = await this.getProgress();
      const userKey = (vId) => `${JSON.parse(sessionStorage.getItem('dflms_session')).id}_${vId}`;
      p[userKey(videoId)] = data;
      localStorage.setItem('dflms_progress', JSON.stringify(p));
    }
  },

  // --- STUDENT PROGRESS (Admin view) ---
  async getAllStudentProgress() {
    if (this.isFirestore()) {
      const snapshot = await window.db.collection('progress').get();
      const result = {};
      snapshot.docs.forEach(doc => { result[doc.id] = doc.data(); });
      return result;
    } else {
      return JSON.parse(localStorage.getItem('dflms_progress') || '{}');
    }
  },

  // --- AUTH ---
  async login(email, password) {
    if (typeof window.auth !== 'undefined') {
      const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Fetch profile for role and name
      let profile = await this.getProfile();
      if (!profile) {
        profile = {
          email: user.email,
          name: user.displayName || email.split('@')[0],
          role: 'student',
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        await window.db.collection('users').doc(user.uid).set(profile);
      }
      const session = {
        id: user.uid,
        email: user.email,
        name: profile.name || profile.email?.split('@')[0] || 'Agent',
        role: profile.role || 'student'
      };
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
