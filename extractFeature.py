import json


lower48 = []
outliers = ["Alaska", "Puerto Rico", "Hawaii"]
outlierList = []

with open("./static/data/gz_2010_us_040_00_20m.json") as TheseUnitedStates:
    compendium = json.loads(TheseUnitedStates.read())
    print(compendium.keys())
    print(compendium["type"])

    for feature in compendium["features"]:
        print(feature["properties"]["NAME"])
        if feature["properties"]["NAME"] in outliers:
            outlierList.append(feature)
        else:
            lower48.append(feature)


    with open("./static/data/lower48.json", "w") as lower48File:
        newCompendium = {"type": compendium["type"], "features": []}
        for state in lower48:
            newCompendium["features"].append(state)
        lower48File.write(json.dumps(newCompendium))

    for outlier in outlierList:
        with open("./static/data/" + outlier["properties"]["NAME"].replace(" ", "_") + ".json", "w") as stateFile:
            newCompendium = {"type": compendium["type"], "features": [outlier]}
            stateFile.write(json.dumps(newCompendium))