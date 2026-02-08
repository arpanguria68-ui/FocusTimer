// MANUAL FIX: Populate playlist with quote IDs
// Run this in your browser console while logged in

const state = JSON.parse(localStorage.getItem('quotes-state_user_39DLJRrcxKjUr0gmKYrELgDGuFd'));

console.log('Current state:');
console.log('- Cached quotes:', state.cachedPlaylistQuotes?.length);
console.log('- Playlist:', state.playlists?.[0]);

if (state.cachedPlaylistQuotes && state.cachedPlaylistQuotes.length > 0 && state.playlists && state.playlists.length > 0) {
  // Get quote IDs from cached quotes
  const quoteIds = state.cachedPlaylistQuotes.map(q => q.id);
  
  // Add to first playlist
  state.playlists[0].quoteIds = quoteIds;
  
  // Save back
  localStorage.setItem('quotes-state_user_39DLJRrcxKjUr0gmKYrELgDGuFd', JSON.stringify(state));
  
  console.log('✅ SUCCESS! Added', quoteIds.length, 'quotes to playlist');
  console.log('Updated playlist:', state.playlists[0]);
  console.log('Reload extension and test popup!');
} else {
  console.log('❌ Cannot fix: Missing quotes or playlist');
  console.log('Make sure you:');
  console.log('1. Are logged in');
  console.log('2. Have created quotes');
  console.log('3. Have a playlist');
}
