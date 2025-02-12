Around a year ago I attempting daily driving [Hyprland](https://hyprland.org/) (as seen [here](https://github.com/AnAncientForce/dotfiles)), I had setup a GPU pass-through so I could still play games, the reason I did this was because I was using a Blade 15 laptop, which was essentially a NVIDIA-based hybrid gaming laptop, at this time, NVIDIA + Wayland stability was very poor, at least in my experience.

So here we are in 2025, where I've finally decided to enter the Linux wormhole once again. This time I will be using [Hyprland](https://hyprland.org/) on my custom-built desktop which has a dedicated `GeForce RTX 4090` and a integrated `AMD ATI 17:00.0 Raphael` graphics card. We'll start the experience from the installation.

---

# What were my primary reasons for wanting to switch to Linux?

### Reason 1: AI

In my experience, machine learning tools are a nightmare to setup on Microsoft Windows. I tried to install [waifuc](https://github.com/deepghs/waifuc) and kept being hit with the error:

```
2024-08-17 09:12:23.6153922 [E:onnxruntime:Default, provider_bridge_ort.cc:1992 onnxruntime::TryGetProviderInfo_CUDA] D:\a\_work\1\s\onnxruntime\core\session\provider_bridge_ort.cc:1637 onnxruntime::ProviderLibrary::Get [ONNXRuntimeError] : 1 : FAIL : LoadLibrary failed with error 126 "" when trying to load "D:\Training Workflow\Video Extraction\.venv\lib\site-packages\onnxruntime\capi\onnxruntime_providers_cuda.dll"

2024-08-17 09:12:23.6229792 [W:onnxruntime:Default, onnxruntime_pybind_state.cc:965 onnxruntime::python::CreateExecutionProviderInstance] Failed to create CUDAExecutionProvider. Require cuDNN 9.* and CUDA 12.*, and the latest MSVC runtime. Please install all dependencies as mentioned in the GPU requirements page (https://onnxruntime.ai/docs/execution-providers/CUDA-ExecutionProvider.html#requirements), make sure they're in the PATH, and that your GPU is supported.
```

This was due to incorrect system PATH Locations being set, however on Linux this is set automatically by the installation script itself. Literally, on Linux, all I had to do was install `cudnn`:

```
sudo pacman -S cudnn
```

### Reason 2: Spyware

I usually setup firewall such as [simplewall](https://github.com/henrypp/simplewall) to prevent cut down Microsoft's  Telemetry. However, this became an issue when the firewall started crashing whenever a program requested internet access. I have no idea why this happened.

Another issue was when I purchased a pack of [Tapo Smart Plugs](https://www.amazon.co.uk/TP-Link-Tapo-Wireless-Control-Required/dp/B0875CTMGH), to use for a Python project of mine, due to simplewall this was an absolute nightmare to setup. Weirdly enough, only when having simplewall + Windows Firewall enabled at the **same time** connectivity to the plugs only seemed to work.

### Reason 3: Buggy Windows 11 File Explorer
There was a bug within File Explorer's address bar that prevented me from modifying and copying various file-paths.

---

# Moving on, here's what my initial plan was:

I would use Linux for:

* AI Processes (Stable Diffusion, Locally hosted large language models)
* Console Emulators, PC Games (Repacks)
* Coding, Media Entertainment, Research
* scrcpy for playing android games via my own phone

I would use Windows for:

* Games with Anti-Cheat, such as gacha games → **Solution**? Dual Boot Windows.
* Game modding (Mario Kart Wii), **which i will no longer do in 2025**
* Microsoft Access, for college → **Solution**? Use a Virtual Machine based on the USB Drive

Downsides:

* When switching OS, all Bluetooth devices have to be repaired→ **Solution**? Use IEMs, Wired Controllers or Receiver-Based Wireless Controllers 
* When using Linux for gaming, additional setup and configuration is required → **Solution**? Learn how.
* There is no Adobe Photoshop on Linux → **Solution**? Dual boot but I barely use this anyway.

What did I lose:

* BlueStacks
* Gacha Games
* Nintendo Switch file system integration
* MusicBee ☹️
* FreeFileSync → **But there's a much better alternative anyway**

What did I gain?

* A Much MUCH better terminal.
* Better system control
* Do not need to use a firewall
* Easier configuration
* feh

---
# The Installation
## Step 1: Installing Arch Linux

We'll be using [archinstall](https://github.com/archlinux/archinstall) for the semi-automated installation.

Let's begin by synchronising our mirrors and running the installation script:

```
pacman -Sy ; archinstall
```

Once the installation script has loaded, we fill out the appropriate sections:

```
Language: English
Keyboard Layout: US
Mirror region:
Locale Language: en_GB
Locale Encoding: UTF-8
Drives:
Bootloader: grub-install
Swap: True
Hostname: archlinux
Root password:
User account: Z
Profile: hyprland
Audio: piprewire
Kernels: ['linux']
Additional packages: kitty
Network configuration: Network Manager
Timezone:
Automatic time sync (NTP):
Optional repositories: ['multilib']
```

* Language → Set to your language.
* Keyboard Layout → Set to the type of keyboard you have (mine is a `US` Japanese-style keyboard).
* Mirror region → Download packages from the closest available server in your region.
* Locale Language →
* Locale Encoding →
* Drives →
* Boot-loader →
* Swap →
* Hostname → Is the name of your PC, can be anything.
* Root password → Highly recommended to set this.
* User account →
* Profile → This is your desktop environment / window manager
* Audio → This is your audio server; choose between `pipewire` or `pulseaudio`, be sure to select one!
* Kernels → Select your kernel, default is `linux`
* Additional packages → Any programs to install first 
* Network configuration → Do not forget about this! (I did and had to reinstall)
* Timezone →
* Automatic time sync (NTP) → 
* Optional repositories → Add `multilib` if you want to install programs like Steam.

Finally, select that `Install` entry!

Now, after the 5 second countdown the installation will begin. Keep a close watch and ensure everything goes smoothly. 

The user account creation was bugged, so I had to create a user account [manually](https://www.makeuseof.com/how-to-add-create-new-superuser-linux/)
## Step 2: Using a secondary installation script

Before even considering to install Hyprland with NVIDIA again, I did a quick search on Reddit to see how other people's experience with Hyprland + NVIDIA had been. I came across this [post](https://www.reddit.com/r/hyprland/comments/1hh14d8/hyprland_with_nvidia/), and someone suggested to use this [tool](https://github.com/JaKooLit/Arch-Hyprland). Technically, this is installing someone else's customisation of Hyprland, but I only ran it for the automated installation of the necessary drivers and environment variables, after that I simply removed every bit of customisation that was applied.

## Step 3: Creating my `hyprland.conf` file

You can see how configuring Hyprland works [here](https://wiki.hyprland.org/Configuring/)

Now here's the tricky part, I have three monitors. It is more simple to use one monitor, but since I want to use all three, here's what I did:

```
# Primary

workspace = 99, monitor:DP-2
workspace = 1, monitor:DP-2, default:true
workspace = 2, monitor:DP-2
workspace = 3, monitor:DP-2
workspace = 4, monitor:DP-2
workspace = 5, monitor:DP-2
workspace = 6, monitor:DP-2o
workspace = 7, monitor:DP-2
workspace = 8, monitor:DP-2
workspace = 9, monitor:DP-2

bind = $mainMod, 0, workspace, 99
bind = $mainMod, 1, workspace, 1
bind = $mainMod, 2, workspace, 2
bind = $mainMod, 3, workspace, 3
bind = $mainMod, 4, workspace, 4
bind = $mainMod, 5, workspace, 5
bind = $mainMod, 6, workspace, 6
bind = $mainMod, 7, workspace, 7
bind = $mainMod, 8, workspace, 8
bind = $mainMod, 9, workspace, 9

bind = $mainMod SHIFT, 0, movetoworkspace, 99
bind = $mainMod SHIFT, 1, movetoworkspace, 1
bind = $mainMod SHIFT, 2, movetoworkspace, 2
bind = $mainMod SHIFT, 3, movetoworkspace, 3
bind = $mainMod SHIFT, 4, movetoworkspace, 4
bind = $mainMod SHIFT, 5, movetoworkspace, 5
bind = $mainMod SHIFT, 6, movetoworkspace, 6
bind = $mainMod SHIFT, 7, movetoworkspace, 7
bind = $mainMod SHIFT, 8, movetoworkspace, 8
bind = $mainMod SHIFT, 9, movetoworkspace, 9

# Left

workspace = 11, monitor:DP-1, default:true
workspace = 12, monitor:DP-1
workspace = 13, monitor:DP-1
workspace = 14, monitor:DP-1
workspace = 15, monitor:DP-1
workspace = 16, monitor:DP-1
workspace = 17, monitor:DP-1
workspace = 18, monitor:DP-1
workspace = 19, monitor:DP-1

bind = ALT, 1, workspace, 11
bind = ALT, 2, workspace, 12
bind = ALT, 3, workspace, 13
bind = ALT, 4, workspace, 14
bind = ALT, 5, workspace, 15
bind = ALT, 6, workspace, 16
bind = ALT, 7, workspace, 17
bind = ALT, 8, workspace, 18
bind = ALT, 9, workspace, 19

bind = ALT_SHIFT, 1, movetoworkspace, 11
bind = ALT_SHIFT, 2, movetoworkspace, 12
bind = ALT_SHIFT, 3, movetoworkspace, 13
bind = ALT_SHIFT, 4, movetoworkspace, 14
bind = ALT_SHIFT, 5, movetoworkspace, 15
bind = ALT_SHIFT, 6, movetoworkspace, 16
bind = ALT_SHIFT, 7, movetoworkspace, 17
bind = ALT_SHIFT, 8, movetoworkspace, 18
bind = ALT_SHIFT, 9, movetoworkspace, 19

# Right

workspace = 21, monitor:HDMI-A-2, default:true
workspace = 22, monitor:HDMI-A-2
workspace = 23, monitor:HDMI-A-2
workspace = 24, monitor:HDMI-A-2
workspace = 25, monitor:HDMI-A-2
workspace = 26, monitor:HDMI-A-2
workspace = 27, monitor:HDMI-A-2
workspace = 28, monitor:HDMI-A-2
workspace = 29, monitor:HDMI-A-2

bind = CTRL, 1, workspace, 21
bind = CTRL, 2, workspace, 22
bind = CTRL, 3, workspace, 23
bind = CTRL, 4, workspace, 24
bind = CTRL, 5, workspace, 25
bind = CTRL, 6, workspace, 26
bind = CTRL, 7, workspace, 27
bind = CTRL, 8, workspace, 28
bind = CTRL, 9, workspace, 29

bind = CTRL_SHIFT, 1, movetoworkspace, 21
bind = CTRL_SHIFT, 2, movetoworkspace, 22
bind = CTRL_SHIFT, 3, movetoworkspace, 23
bind = CTRL_SHIFT, 4, movetoworkspace, 24
bind = CTRL_SHIFT, 5, movetoworkspace, 25
bind = CTRL_SHIFT, 6, movetoworkspace, 26
bind = CTRL_SHIFT, 7, movetoworkspace, 27
bind = CTRL_SHIFT, 8, movetoworkspace, 28
bind = CTRL_SHIFT, 9, movetoworkspace, 29
```

`Left (DP-1)` | `Primary (DP-2)` | `Right (HDMI-A-2)`

As lengthy as that is, it worked! Simply put, I use the `SUPER` modifier to control my primary monitor, `ALT` modifier to access my left monitor, and `CTRL` modifier to access my right monitor.

Now that our monitors are configured correctly, let's add a bit of customisation to our installation:

In my `hyprland.conf`, I have added these programs to launch automatically when Hyprland starts.

```
exec-once = nm-applet
exec-once = nwg-panel
exec-once = udiskie -t
exec-once = nwg-dock-hyprland -l top -o DP-2 -x -f -i 24
exec-once = swayosd-server
exec-once = hyprpaper
exec-once = hyprsunset
exec-once = copyq --start-server
exec-once = emote
```

Here's a quick list of what they do:

* [nm-applet](https://wiki.archlinux.org/title/NetworkManager) → Displays the network icon in the system tray.
* [nwg-panel](https://github.com/nwg-piotr/nwg-panel) → Displays `Workspace Icons` | `Time & Date` | `System Tray`. You can customise this panel to display anything you'd like.
* [udiskie](https://github.com/coldfix/udiskie) → Automatically mounts all external USB media.
* [nwg-dock-hyprland](https://github.com/nwg-piotr/nwg-dock-hyprland) → Displays all of our open programs on a bar. Similar to Microsoft Windows's taskbar.
* [swayosd-server](https://github.com/ErikReider/SwayOSD) → Displays a notification for when we adjust our system volume, brightness, toggling Caps Lock.
* [hyprpaper](https://github.com/hyprwm/hyprpaper), → Displays our wallpaper.
* [hyprsunset](https://github.com/hyprwm/hyprsunset), → Similar to [F.lux](https://en.wikipedia.org/wiki/F.lux).
* [copyq](https://github.com/hluk/CopyQ) → A clipboard manager. Similar to Microsoft Windows's `CTRL + V` feature.
* [emote](https://github.com/tom-james-watson/Emote) → A emoji panel. Similar to Microsoft Windows's `CTRL` + `;` / `.` feature.

## Step 4: Getting `XWayland` to work efficiently 

The issue "XWayland currently looks pixelated on HiDPI screens, due to Xorg’s inability to scale." - [source](https://wiki.hyprland.org/Configuring/XWayland/)

A lot of programs we use on Microsoft Windows may have a Linux version compatible, these may work great on Xorg, but possibly not on Wayland. The lightly-hood a program having native support for Wayland is relatively low. That's simply because Xorg has been around for decades and so many programs were only built with Xorg in mind. Wayland is still relatively new (yes 20 years old still counts as new).

Here are some popular programs that work perfectly on Xorg, but not Wayland due to scaling issues:

* Visual Studio Code
* Obsidian
* Spotify
* Chromium-based Browsers
* Steam

Not all hope is lost thanks to [XWayland](https://wiki.hyprland.org/Configuring/XWayland/)! This incredible tool enables us to run Xorg programs on Wayland. Due to Xorg’s inability to scale,  XWayland currently looks pixelated on HiDPI screens (such as on my primary monitor). To fix this, you will **not** want to scale XWayland apps globally. Instead, you will want to individually scale of each program via the program itself. 

By adding the following to statements to your `hyprland.conf` you are telling XWayland programs to not scale:

```
env = GDK_SCALE,1

xwayland {
force_zero_scaling = true
}
```

By setting `GDK_SCALE` to `1`, all XWayland programs will be at the default scale which may look extremely small on a HiDPI screens. You will now want to scale of each program manually; programs built on the Electron-framework such as Obsidian allows you to increase the scaling by pressing `SUPER` + `+`.

## Step 5: Getting games to work

Initially, just setting the compatibility to [Proton](https://en.wikipedia.org/wiki/Proton_(software)) and launching games via Steam worked for [some](https://en.wikipedia.org/wiki/Planet_Coaster), but for not others. The solution was to append this to the Launch Options:

```
LD_PRELOAD="" gamescope -e -f -w 3840 -h 2160 -- %command%
```

From my understanding:

* `LD_PRELOAD=""` prevents game from lagging after around 23 minutes.
* `gamescope -e -f -w 3840 -h 2160 -- %command%`
	* [gamescope](https://wiki.archlinux.org/title/Gamescope) is a utility 
	* `-e`
	* `-f` launches the game in full screen.
	* `-w` sets the window width.
	* `-h` sets the window height.
	* `-- %command%` incorporates the original command.

Each game might be different, but this launch argument managed to get games published by [Koei Tecmo](https://store.steampowered.com/developer/KOEITECMO/) to work.

## Step 6: To be continued! ~ It's only been 2 weeks!