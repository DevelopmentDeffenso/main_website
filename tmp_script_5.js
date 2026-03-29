
    const sess = sessionStorage.getItem('dflms_session');
    if (!sess) { window.location.href = 'login.html'; }
    const user = JSON.parse(sess || '{}');
    if (user.role === 'admin') { window.location.href = 'admin.html'; }
  