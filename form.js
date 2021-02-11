class address_form{
    constructor(main_container){
        this.base_url = "rest.php";

        //get the templates for the form
        this._get_tmpl("input");
        this._get_tmpl("select");
        this._get_tmpl("output");
        this._get_tmpl("textarea");
        //contains the container element for the form
        this.main_container = main_container;
    }

    //download template from webserver
    _get_tmpl(name){
        let instance = this;
        let httpreq = new XMLHttpRequest();
        if (httpreq) {
            httpreq.onreadystatechange = function () {
                if (httpreq.readyState == 4) {
                    instance._set_tmpl(this.responseText,name);
                }
            }
    
            httpreq.open("get", this.base_url+"?template="+name);
            httpreq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            httpreq.send(null);
        }
    }

    //when the download from the template is finished, call this method and save the template in an instance var
    _set_tmpl(template,type){
        if(type=="input"){
            this.inputtmpl = template;
        } else if (type=="select"){
            this.selecttmpl = template;
        } else if (type=="output"){
            this.outputtmpl = template;
        } else if (type=="textarea"){
            this.textareatmpl = template;
        }
    }

    //method to create the base structure of the form in the empty container
    create_form(){
        //create basic form element
        let formelmt = document.createElement('form');
        formelmt.id = "address_form";
        this.main_container.appendChild(formelmt);

        //create a select object for the countries
        this.countries = document.createElement('select');
        this.countries.id = "countries-select";
        this.countries.classList.add("countries");
        formelmt.appendChild(this.countries);
        let newitem = document.createElement('option');
        newitem.value = "";
        newitem.innerText = "Select country";
        newitem.selected = 'selected';
        newitem.disabled = true;
        this.countries.appendChild(newitem);

        //create a subcontainer for the rest of the form, then it is easier to recreate the form for the specific country
        this.container = document.createElement('div');
        this.container.id = "subform_elements";
        formelmt.appendChild(this.container);

        //fill the select object with the countries
        this._create_countries_list();
    }

    //get a json string with all countries in the db
    _create_countries_list(){
        let instance = this;
        let httpreq = new XMLHttpRequest();
        if (httpreq) {
            httpreq.onreadystatechange = function () {
                if (httpreq.readyState == 4) {                
                    instance._insert_countries(JSON.parse(this.responseText));
                }
            }
    
            httpreq.open("get", this.base_url+"?countries");
            httpreq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            httpreq.send(null);
        }
    }

    //Create country selection options and add an event listener to each option so that the form can be updated for each country
    _insert_countries(data){
        let instance = this;
        this.countries.addEventListener("change", function(){
            instance._get_country_infos(this.value);
        });
    
        let keys = Object.keys(data);
        for(let i = 0; i < keys.length; i++){
            let newitem = document.createElement('option');
            newitem.value = keys[i];
            newitem.innerText = this._capitalizeFirstLetter(data[keys[i]].toLowerCase());
            this.countries.appendChild(newitem);
        }
    }

    _capitalizeFirstLetter(string) {
        return string.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');;
    }

    //get a json string with the specific country information
    _get_country_infos(country){
        let instance = this;
        let httpreq = new XMLHttpRequest();
        if (httpreq) {
            httpreq.onreadystatechange = function () {
                if (httpreq.readyState == 4) {
                    instance._create_form(JSON.parse(this.responseText));
                }
            }
    
            httpreq.open("get", this.base_url+"?id="+country);
            httpreq.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            httpreq.send(null);
        }
    }

    _create_form(data){
        //clear the form div
        this.container.innerHTML = '';
        //specify the input type of the flag
        let type_to_element = {"N":"input","O":"input","A":"input","D":"input","C":"input","S":"select","Z":"input","X":"input"};
        //specify the autocomplete datatype
        let autocomplete = {"N":"name","O":"organization","A":"street-address","D":"off","C":"address-level2","Z":"postal-code","X":"off","S":"off"}
        //specify the name on the flag  to be displayed
        let name_of_element = {"N":"Name","O":"Organisation","A":"Street Address Lines","D":this._capitalizeFirstLetter(data["sublocality_type"]),"C":this._capitalizeFirstLetter(data["locality_type"]),"S":this._capitalizeFirstLetter(data["administrative_area_type"]),"Z":this._capitalizeFirstLetter(data["code_type"])+"-Code","X":"Sorting code"}
        
        //get the paresed format array
        this.parsed_format = this._split_format(data["format"]);

        this.country_infos = data;
    
        //loop through the the rows of the format array
        for(let i = 0; i < this.parsed_format.length; i++){
            let rowcontainer = document.createElement("div");
            rowcontainer.classList.add("container_row");
            let flag_a_in_row = false;
            //loop through each element in a row
            for(let elements = 0; elements < this.parsed_format[i].length; elements++){
                //if the element is a string create a span and insert the string into it
                if(this.parsed_format[i][elements]["type"] == "string"){
                    let newitem = document.createElement("span");
                    newitem.classList.add("string");
                    newitem.innerHTML = this.parsed_format[i][elements]["text"];
                    rowcontainer.appendChild(newitem);
                //if its a flag go through this code
                } else if (this.parsed_format[i][elements]["type"] == "flag"){
                    //check if flag is optional
                    let optional;
                    if(data["require"].includes(this.parsed_format[i][elements]["flag"])){
                        optional = "";
                    } else {
                        optional = "optional";
                    }
    
                    //render_form
                    if(type_to_element[this.parsed_format[i][elements]["flag"]] == "input"){
                        //render input
                        let renderdata = {"id":this.parsed_format[i][elements]["flag"],"label":name_of_element[this.parsed_format[i][elements]["flag"]],"optional_str":optional,"name":this.parsed_format[i][elements]["flag"],"autocomplete":autocomplete[this.parsed_format[i][elements]["flag"]]};
                        //add regex for the input
                        if(this.parsed_format[i][elements]["flag"] == "Z"){
                            renderdata["fmt"] = data["code_pattern"];
                        } else {
                            renderdata["fmt"] = ".*";
                        }
                        //add styles for the input
                        if(data["upper_case"].includes(this.parsed_format[i][elements]["flag"])){
                            renderdata["styles"] = "text-transform: uppercase;";
                        } else {
                            renderdata["styles"] = "";
                        }
                        rowcontainer.innerHTML += this._render_template(this.inputtmpl,renderdata,"input");
                    } else if (type_to_element[this.parsed_format[i][elements]["flag"]] == "select"){
                        //Render input, although the type should be select, because sometimes the array administrative_areas has no elements and then there should be an input
                        if(!("administrative_areas" in data)){
                            let renderdata = {"id":this.parsed_format[i][elements]["flag"],"label":name_of_element[this.parsed_format[i][elements]["flag"]],"optional_str":optional,"name":this.parsed_format[i][elements]["flag"],"autocomplete":autocomplete[this.parsed_format[i][elements]["flag"]],"fmt":".*","styles":""};
                            rowcontainer.innerHTML += this._render_template(this.inputtmpl,renderdata,"input");
                        } else {
                            //render select
                            let renderdata = {"id":this.parsed_format[i][elements]["flag"],"label":name_of_element[this.parsed_format[i][elements]["flag"]],"optional_str":optional,"name":this.parsed_format[i][elements]["flag"],"options":data["administrative_areas"]}
                            rowcontainer.innerHTML += this._render_template(this.selecttmpl,renderdata,"select");
                        }
                    }
                    //the street address line should be multiline. therefore a textarea is inserted after the input
                    //checks if in the row is a street address line
                    //because the textarea can be added only after the element is in the DOM
                    if(this.parsed_format[i][elements]["flag"] == "A"){
                        flag_a_in_row = true;
                    }
                }
            }
            this.container.appendChild(rowcontainer);
            //If there is a street address line, add a texterea element
            //now the element is in the DOM and the textarea can be added
            if(flag_a_in_row){
                let renderdata = {"id":"A","name":"A","autocomplete":"off"};
                document.getElementById("A").innerHTML += this._render_template(this.textareatmpl,renderdata,"textarea");
            }
        }
    }

    //split the format string into array elements for each line. Each element is represented by a type and the info is stored in the flag or text
    _split_format(format){
        let returndata = [];
    
        //split at every line
        let lines = format.split("%n");
        //go through each line
        for(let i = 0; i < lines.length; i++){
            returndata[i] = [];
            let arraypos = 0;
            let startofstring = true;
            //loop through each char of the line
            for(let charpos = 0; charpos < lines[i].length; charpos++){
                //if a % is present, then the next character is a flag
                if(lines[i].charAt(charpos) == "%"){
                    //if a string was before the flag, increase the arrapos by one so that a new element is created after the string element
                    if(!startofstring){
                        arraypos++;
                    }
                    //save the flag in the returnarray
                    returndata[i][arraypos] = {"type":"flag"};
                    //add one to the charpos so that the elementchar flag is skipped on the next pass
                    returndata[i][arraypos]["flag"] = lines[i].charAt(++charpos);
    
                    //increments the array position by one for the next element
                    arraypos++;
                    //always resets the startofstring, because then a new element is created if it is a string, otherwise the character is appended to the existing string
                    startofstring = true;
                } else {
                    //if it is the beginning of a string, add a new element to the return array
                    if(startofstring){
                        returndata[i][arraypos]= {"type":"string","text":""};
                        startofstring = false;
                    }
                    //if it is in a string, add only the character
                    if(lines[i].charAt(charpos) == " "){
                        returndata[i][arraypos]["text"] += "&nbsp;";
                    } else {
                        returndata[i][arraypos]["text"] +=lines[i].charAt(charpos);
                    }
                }
            }
        }
        return returndata;
    }

    //fills the template with the specified data into the dummy spots of the template. The key of the data array is the name of the dummy spot
    _render_template(template, data, type) {
        let html, regex;
    
        //check if the template is an input field
        if(type=="input" || type=="textarea" || type=="output"){
            for (let key in data) {
                regex = new RegExp('{{' + key + '}}', 'ig');
                html = (html|| template).replace(regex, data[key]);
            }
        //check if the template is a selection field
        } else if (type=="select"){
            for (let key in data){
                if(key != "options"){
                    regex = new RegExp('{{' + key + '}}', 'ig');
                    html = (html|| template).replace(regex, data[key]);
                } else {
                    //if subarray, search for the area in the template to put data into it
                    //regex = new RegExp('(?<={{#' + key + '}})(.*)(?={{\/' + key + '}})','igs');
                    regex = new RegExp('{{#' + key + '}}(.*)(?={{\/' + key + '}})','igs');
                    //get subregion element template
                    let optionstemplate = regex.exec(template)[1];
                    //remove subregion element from template
                    html = (html|| template).replace(regex, "{{#" + key + "}}");
                    for(let subkey in data[key]){
                        //Split the template into parts and insert the filled subarea template between the parts.
                        regex = new RegExp('(.*)({{\/' + key + '}}.*)','igs');
                        let regex_val = new RegExp('{{subkey}}','ig');
                        let regex_name = new RegExp('{{value}}','ig');
                        let splithtml = regex.exec(html);
                        html = splithtml[1] + optionstemplate.replace(regex_val,subkey).replace(regex_name,data[key][subkey]["name"]) + splithtml[2];
                    }
                    //remove the markers for the options
                    regex = new RegExp('{{.' + key + '}}','igs');
                    html = html.replace(regex, "");
                }
            }
        }
        return html;
    }

    get_address_data(){
        let input_data = [];
        //Get all elements of the form
        let tmp = document.getElementById("address_form").elements;
        for(let i = 0; i < tmp.length; i++){
            //Data that are collected
            let input_element = {"id":"","value":"","type":"","text":""};
            //Split id
            let regex_id = new RegExp('(.+)-(.+)','ig');
            let match = regex_id.exec(tmp[i].id);
            if(match != null){
                //fill array with data
                input_element["id"] = match[1];
                input_element["type"] = match[2];
                if(input_element["type"] == "select"){
                    //if it is a select additionally save the text of the option
                    if(this.country_infos["upper_case"].includes(input_element["id"])){
                        input_element["text"] = tmp[i].options[tmp[i].selectedIndex].text.toUpperCase();
                    } else {
                        input_element["text"] = tmp[i].options[tmp[i].selectedIndex].text;
                    }
                }
            }
            if(this.country_infos["upper_case"].includes(input_element["id"])){
                input_element["value"] = tmp[i].value.toUpperCase();
            } else {
                input_element["value"] = tmp[i].value;
            }
            input_data.push(input_element);
        }
        return input_data;
    }

    output_address(output_wrapper){
        if (typeof this.parsed_format !== 'undefined') {
            output_wrapper.innerHTML = "";
            let data = this.get_address_data();
            //go through all format rows
            for(let line = 0; line < this.parsed_format.length; line++){
                //create a div for each line
                let rowcontainer = document.createElement("div");
                rowcontainer.classList.add("container_row");
                let addRow = true;
                //go through each element of the row
                for(let element = 0; element < this.parsed_format[line].length; element++){
                    let renderdata = {"text":""};
                    if(this.parsed_format[line][element]["type"] == "flag"){
                        //if it is the street address line several lines may be needed
                        if(this.parsed_format[line][element]["flag"] == "A"){
                            //go through all the data and use each a element
                            for(let data_el = 0; data_el < data.length; data_el++){
                                if(data[data_el]["id"] == "A"){
                                    let rowcontainer = document.createElement("div");
                                    rowcontainer.classList.add("container_row");
                                    //if it is a textarea it must be made multiline
                                    if(data[data_el]["type"] == "textarea"){
                                        renderdata = {"text":data[data_el]["value"].replace(/(?:\r\n|\r|\n)/g, '<br>')};
                                    } else {
                                        renderdata = {"text":data[data_el]["value"]};
                                    }
                                    rowcontainer.innerHTML += this._render_template(this.outputtmpl,renderdata,"output");
                                    output_wrapper.appendChild(rowcontainer);
                                    addRow = false;
                                }
                            }
                        } else {
                            //if it is another flag
                            let run = true;
                            for(let data_el = 0; data_el < data.length && run; data_el++){
                                if(data[data_el]["id"] == this.parsed_format[line][element]["flag"]){
                                    if(data[data_el]["type"] == "select"){
                                        renderdata = {"text":data[data_el]["text"]};
                                    } else {
                                        renderdata = {"text":data[data_el]["value"]};
                                    }
                                    run = false;
                                }
                            }
                            rowcontainer.innerHTML += this._render_template(this.outputtmpl,renderdata,"output");
                        }
                    //if it is a string
                    } else if(this.parsed_format[line][element]["type"] == "string"){
                        renderdata = {"text":this.parsed_format[line][element]["text"]};
                        rowcontainer.innerHTML += this._render_template(this.outputtmpl,renderdata,"output");
                    }
                }
                if(addRow){
                    output_wrapper.appendChild(rowcontainer);
                }
            }
            //add the country as the last line
            let rowcontainer = document.createElement("div");
            rowcontainer.classList.add("container_row");
            let run = true;
            let renderdata = {"text":""};
            for(let i = 0; i < data.length && run; i++){
                if(data[i]["id"] == "countries"){
                    renderdata = {"text":data[i]["text"]};
                    run = false;
                }
            }
            
            rowcontainer.innerHTML += this._render_template(this.outputtmpl,renderdata,"output");
            output_wrapper.appendChild(rowcontainer);
        }
    }
}

window.onload = function () {
    //create a new address_form object
    let form = new address_form(document.getElementById("form"));
    //create the form on the website
    form.create_form();

    //output
    document.getElementById("result").addEventListener("click", function(){
        form.output_address(document.getElementById("output_address_wrapper"));
    });
}