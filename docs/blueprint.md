# **App Name**: OffGrid Camera

## Core Features:

- Connection Manager: Initiate and manage Bluetooth or peer-to-peer WiFi connections between devices, acting as either host or client based on user selection. Should offer feedback of why the app will only work offline and make sure no wifi and or cell services are enabled.
- Video Streaming: Stream video feed from the camera device to the display device over the established connection.
- Display Settings: Client setting to keep screen active while viewing the camera feed.
- Camera Settings: Host feature that ensures the camera remains active in the background. Implementing a tool using a model to handle device-specific variations in background task management, ensuring continuous operation across different devices. Implement low power usages if possible, potentially turning screen off
- Zooming Capability: Client feature that implement digital zoom functionality controlled from the display device.
- UI Host/Client selector: Interface to pick if client or host should be launched, also displays status updates.
- Dynamic Scaling: Resizes the video stream output in all client views and on the host device without needing a restart.

## Style Guidelines:

- Primary color: Dark Grey (#333333) to minimize screen brightness and power consumption.
- Background color: Near-Black (#1A1A1A) for optimal power saving on OLED screens.
- Accent color: Light Teal (#66A3A3) to provide necessary contrast without causing eye strain, analogous to the dark grey.
- Font: 'Inter' (sans-serif) for a modern, readable interface that is clear and efficient.
- Use simple, monochrome icons for essential functions to reduce visual complexity and save power.
- Create a minimalist layout with controls that appear on demand, maximizing the video display area.
- Avoid animations to conserve power. Use subtle transitions if necessary.