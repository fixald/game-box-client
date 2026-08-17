/**
 * Client API route contract. Keep business requests under this namespace.
 * Do not use bare `/api/*` paths in views or documentation.
 */
export const CLIENT_API_PREFIX = '/api/v1/client'

export const clientApi = {
  auth: {
    login: `${CLIENT_API_PREFIX}/auth/login`,
    register: `${CLIENT_API_PREFIX}/auth/register`,
    refresh: `${CLIENT_API_PREFIX}/auth/refresh`,
    logout: `${CLIENT_API_PREFIX}/auth/logout`,
    passwordResetRequest: `${CLIENT_API_PREFIX}/auth/password/reset/request`,
    passwordResetConfirm: `${CLIENT_API_PREFIX}/auth/password/reset/confirm`,
  },
  account: `${CLIENT_API_PREFIX}/users/me`,
  games: `${CLIENT_API_PREFIX}/games`,
  servers: `${CLIENT_API_PREFIX}/game-servers`,
  tasks: `${CLIENT_API_PREFIX}/tasks`,
  messages: `${CLIENT_API_PREFIX}/messages`,
  search: `${CLIENT_API_PREFIX}/search`,
  searchSuggestions: `${CLIENT_API_PREFIX}/search/suggestions`,
  searchHot: `${CLIENT_API_PREFIX}/search/hot`,
  searchHistory: `${CLIENT_API_PREFIX}/search/history`,
  searchEvents: `${CLIENT_API_PREFIX}/search/events`,
  vipLevels: `${CLIENT_API_PREFIX}/vip/levels`,
  banners: `${CLIENT_API_PREFIX}/banners`,
  liveRooms: `${CLIENT_API_PREFIX}/live/rooms`,
  liveCategories: `${CLIENT_API_PREFIX}/live/categories`,
  liveRoom: `${CLIENT_API_PREFIX}/live/room`,
  liveHeartbeat: `${CLIENT_API_PREFIX}/live/room/heartbeat`,
  liveRevokePushUrl: `${CLIENT_API_PREFIX}/live/room/revoke-push-url`,
  liveStreamers: `${CLIENT_API_PREFIX}/live/streamers`,
  liveFollowing: `${CLIENT_API_PREFIX}/users/me/live/following`,
  liveEvents: `${CLIENT_API_PREFIX}/events`,
  reports: `${CLIENT_API_PREFIX}/reports`,
} as const
