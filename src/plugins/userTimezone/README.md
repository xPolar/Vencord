# UserTimezone Plugin

A Vencord plugin that allows you to set and display users' local timezones on their profiles, similar to how Slack shows "2:11 PM local time".

## Features

- **Set Timezone**: Right-click on any user and select "Set Timezone" to assign their timezone
- **Searchable Timezone List**: Modal with searchable IANA timezone database (~400 timezones)
- **Profile Display**: Shows clock icon with current local time on user profiles
- **Auto-Update**: Time updates automatically every minute
- **Clear Timezone**: Option to remove saved timezones
- **Per-Account Storage**: Timezone data is isolated per Discord account

## Usage

### Setting a Timezone

1. Right-click on any user
2. Select "Set Timezone" from the context menu
3. Search and select their timezone from the list (e.g., "America/New_York", "Europe/London")
4. Click "Save"

### Clearing a Timezone

1. Right-click on the user
2. Select "Set Timezone"
3. Click "Clear Timezone" button

### Viewing Timezones

Once a timezone is set, the user's profile will display:
```
🕐 2:11 PM local time
```

The time updates automatically every minute and displays in 12-hour format.

## Technical Details

### Data Storage

- Uses Vencord's DataStore API for persistent storage
- Data is cached in memory for performance
- Timezones are stored per Discord account (isolated per user ID)
- Data key format: `UserTimezone_timezones_{userId}`

### Time Calculation

- Uses JavaScript's native `Intl.DateTimeFormat` API
- Respects IANA timezone database
- Handles daylight saving time automatically
- Format: 12-hour with AM/PM

### Profile Integration

- Patches the user profile load section
- Displays below user status
- Wrapped in ErrorBoundary for stability
- Gracefully handles invalid timezones

### Context Menu

- Adds "Set Timezone" option to user context menu
- Shows nested "Clear Timezone" option when timezone is set
- Updates DataStore on save/clear actions

## Files

- `index.tsx` - Main plugin definition, patches, and context menu
- `components.tsx` - React components (TimezoneIndicator, SetTimezoneModal)
- `utils.ts` - Data storage utilities (cache, save, load)
- `timezones.ts` - IANA timezone database (~400 timezones)
- `style.css` - Styling for indicator and modal
- `README.md` - This documentation

## Example Timezones

- America/New_York (UTC-05:00)
- America/Chicago (UTC-06:00)
- America/Denver (UTC-07:00)
- America/Los_Angeles (UTC-08:00)
- Europe/London (UTC+00:00)
- Europe/Paris (UTC+01:00)
- Asia/Tokyo (UTC+09:00)
- Australia/Sydney (UTC+10:00)

## Error Handling

- Invalid timezones return null and don't crash the plugin
- ErrorBoundary wraps the TimezoneIndicator component
- Try-catch around `Intl.DateTimeFormat` calls
- Graceful fallback when timezone data is missing

## Future Enhancements

- Automatic timezone detection based on user's Discord locale
- Timezone display in member list and messages
- Support for multiple timezone formats (24-hour, etc.)
- Timezone abbreviations (EST, PST, etc.)
- Export/import timezone lists

## Credits

Inspired by:
- Slack's local time feature
- BetterDiscord Timezones plugin
- Vencord's UserVoiceShow plugin pattern
