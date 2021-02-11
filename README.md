# JS address form

![form](https://raw.githubusercontent.com/fabiankuffer/JS-address-form/main/screenshot.png)

## Before first use
Before you can use the form, you must download the information from the Google server via the **Parser/Parser Python file**.
Use the `-u` option and **specify filename** or `-h` to see all the other options.
The filename under which the php code is configured is **address_format_data.db** and the file should be located in the **db folder**.

## Folder structure
- in the **config folder** you can change the folder of the template files and the filename and location of the database

- in the **parser folder** there is only the python downloader script

- the **templates folder** contains the form inputs that the js file uses to create the form

- the **form.js** is the class that dynamically creates the form

- The **index.php** is a sample file of how to use the form. the js class needs a div with ID **form** to create the form in it. In the DIV with the ID **output** is the address displayed.

- the **main.css** is a default design for the form

- The file **rest.php** provides the js class with the country list, the country information and the templates

## Notes
- Add rules to prohibit access to db-, templates- and parser folder

This project uses the address data from [Google Libaddressinput Library](https://github.com/google/libaddressinput) :+1:

inspired by: [How Etsy Localizes Addresses](https://codeascraft.com/2018/09/26/how-etsy-localizes-addresses/)
