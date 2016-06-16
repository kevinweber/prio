# Prio
## Screenshots
![Login screen](https://kevinw.de/github/img/prio-login.jpg "Login")

![Priority List](https://kevinw.de/github/img/prio-list.jpg "Priority List")

![Priority Matrix](https://kevinw.de/github/img/prio-matrix.jpg "Priority Matrix")

## What is this?
Prio is a simple tool to sort tasks into a list and into a priority matrix (inspired by [Steven Covey](https://www.google.com/search?num=100&biw=1280&bih=678&q=stephen+covey+priority+matrix&oq=stephen+covey+priority+matrix&gs_l=serp.3..0j0i8i30l2.1284.2428.0.3020.9.9.0.0.0.0.352.1068.0j5j0j1.6.0....0...1c.1.64.serp..4.5.874...0i7i30j0i8i7i30.6ZvPmN_IlOM)). It requires an account for the to-do list app Wunderlist and makes use of their API.

Prio is very experimental and NOT intended for use in production. It is not tested across browsers and security flaws are definitely possible. Use it on your own risk.

* Login with your Wunderlist account. NOTE: The access token provided by Wunderlist is currently stored as cookie and, thus, accessible by everyone who has access to your device. This tool doesn't follow current security best practices at all. Use it on your own risk.
* Every task can be moved using drag'n'drop.
* Tasks in the list and matrix are stored in your browser locally. But you can also move tasks from, for example, "Overdue" to "Tomorrow". In this case, the new date will be stored into your Wunderlist account!
* You can check a task to mark it as done. You can also undo checking the task. This will synchronize with your Wunderlist account.
* A not very sophisticated debug mode can be activated by appending `&debug=true` to the URL.
* Append `&clearStorage=true` to the URL to reset your browser's local storage. This will reset the list and matrix but not affect your tasks stored in Wunderlist.

Because the development of this tool was just intended for training purposes, it still lacks tons of basic features and has several bugs. For example, it's not possible to create new tasks within that tool. (You have to create them in your Wunderlist app.)

## Setup
* [Download](https://github.com/kevinweber/prio/archive/master.zip) the current code from this repository, unzip it and navigate into the folder.
* In your terminal, install all dependencies using `$ npm install`.
* Change the filename of `example__private.settings.php` in `src/` to `private.settings.php` and insert your client secret. You get that secret by creating an app on [developer.wunderlist.com](https://developer.wunderlist.com/). Moreover, that folder also includes a file named `settings.php`. There you have to insert your app's client ID (from Wunderlist) and provide a callback URL.
* Create production ready code by running `$ npm run build-production`.
* Open the `dist/` folder on a web server, for example using MAMP or by running `$ php -S localhost:1337`