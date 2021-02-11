<?php
    header("Content-Type: application/json; charset=UTF-8");

    #load config
    $ini = parse_ini_file('./config/api.ini');

    $db = $ini["db_file_location"];

    #check if file exists
    if (file_exists($db)) {
        $pdo = new PDO('sqlite:' . $db);
        if($pdo){
            #only run if pdo connected
            if(isset($_GET['countries'])){
                #return all countries
                $stmt = $pdo->prepare("SELECT * FROM countries ORDER BY name");
                $stmt->execute();
                $data = array();
                while ($row = $stmt->fetch()) {
                    $data[$row["key"]] = $row["name"];
                }
                echo json_encode($data);
            } elseif (isset($_GET['id'])){
                #get country information and default information
                $stmt = $pdo->prepare("SELECT format.key, format.value, format.id FROM format 
                INNER JOIN countries ON countries.id=format.country_id 
                WHERE countries.key = :isoid AND format.parent_id IS NULL 
                UNION 
                SELECT key, value, 0 FROM defaults 
                WHERE NOT EXISTS(
                    SELECT format.key FROM format 
                    INNER JOIN countries 
                    ON countries.id=format.country_id 
                    WHERE countries.key = :isoid AND format.parent_id IS NULL AND defaults.key = format.key
                );");
                $stmt->execute(array("isoid" => $_GET['id']));
                $data = array();
                #get all info about the subregion
                while ($row = $stmt->fetch()) {
                    if($row["key"] != "sub_keys"){
                        $data[$row["key"]] = $row["value"];
                    } else {
                        $states = array();
                        $stmt2 = $pdo->prepare("SELECT format.key, format.value, format.id FROM format WHERE parent_id=:parent_id");
                        $stmt2->execute(array("parent_id" => $row["id"]));
                        while ($sub = $stmt2->fetch()) {
                            $states[$sub["key"]] = array();
                            $stmt3 = $pdo->prepare("SELECT format.key, format.value FROM format WHERE parent_id=:parent_id");
                            $stmt3->execute(array("parent_id" => $sub["id"]));
                            while ($state = $stmt3->fetch()) {
                                $states[$sub["key"]][$state["key"]] = $state["value"];
                            }
                        }
                        $data["administrative_areas"] = $states;
                    }
                }
                echo json_encode($data);
            } else if (isset($_GET['template'])) {
                #returns a list of all available templates or the specified template 
                if(empty($_GET['template'])){
                    #return list of templates
                    $templates = glob($ini["template_folder"]."*.tmpl");
                    for($i = 0; $i < count($templates); $i++){
                        $templates[$i] = basename($templates[$i], ".tmpl");
                    }
                    echo json_encode($templates);
                } else {
                    #return template
                    echo file_get_contents($ini["template_folder"].pathinfo($_GET['template'])['filename'].".tmpl");
                }
            } else {
                echo json_encode(array("error"=>"unsupported get parameter"));
            }
        } else {
            echo json_encode(array("error"=>"no pdo connection"));
        }
    } else {
        echo json_encode(array("error"=>"file not found"));
    }
?>