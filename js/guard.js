import {signedIn, myProfile, getMyRole, signOut} from './supabase.js';
const root=document.querySelector('main');if(root)root.hidden=true;
try{if(!signedIn()){location.replace('identificate.html?next=agenda.html');}else{await myProfile();if(root)root.hidden=false;}}catch(e){if(root)root.hidden=true;location.replace('identificate.html?next=agenda.html');}
