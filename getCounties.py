import json
import os

def get_all_files(directory):
    file_list = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if len(file.replace(".geo.json", "")) == 2:
                file_list.append(["state", file.replace(".geo.json", "")])
            else:
                file_list.append([root.replace("static/data/world/countries/USA\\", ""), file.replace(".geo.json", "")])
    return file_list

# Example usage
directory_path = 'static/data/world/countries/USA'
all_files = get_all_files(directory_path)
print(all_files)

with open("static/data/USAMeta.json", "w") as file:
    json_data = {
        "metaTuples": all_files
    }
    file.write(json.dumps(json_data))