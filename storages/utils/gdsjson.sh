#!/usr/bin/env bash

get_directory_structure_json() {
  local dir="$1"
  local depth="$2"
  local id="$3"
  local result=""

  if [ ! -d "$dir" ]; then
    echo "Error: Catalog '$dir' not exists." >&2
    return 1
  fi

  result+='{'
  result+='"id": "'$id'",'
  result+='"label": "'$(basename "$dir")'",'
  result+='"fileType": "folder",'
  result+='"path": "'$dir'",'
  result+='"children": ['

  local _depth=$(echo "$id" | grep -o "\." | wc -l)
  local items=$(ls -p -a "$dir" | grep -v /)
  local subdirs=$(ls -p -a "$dir" | grep / | grep -v .git)
  local _id="0"

  if [[ ! -z "$subdirs" ]]; then
    for subdir in $subdirs; do
      if [[ "$_depth" == "$depth" ]]; then
        break
      fi
      subdir=$(echo "$subdir" | tr -d '/')
      if [[ "$subdir" =~ ^\.+$  ]]; then
        continue
      fi
      if [[ "$_id" != "0" ]]; then
        result+=','
      fi
      ((_id+=1))
      subdir_result=$(get_directory_structure_json "$dir/$subdir" "$depth" "$id"".""$_id")
      if [[ $? -eq 0 ]]; then
          result+=$subdir_result
      fi

    done

    result=$(echo "$result" | sed 's/,$//')
  fi

  if [[ "$_id" != "0" ]]; then
    result+=','
  fi

  if [[ ! -z "$items" ]]; then
    for item in $items; do
      if [[ "$_depth" == "$depth" ]]; then
        break
      fi
      ((_id+=1))
      result+='{'
      result+='"id": "'$id'.'$_id'",'
      result+='"label": "'$item'",'
      result+='"fileType": "file",'
      result+='"path": "'$dir/$item'"'
      result+='},'
    done

  fi

  result=$(echo "$result" | sed 's/,$//')
  result+=']}'

  echo "$result"
}

main() {
  local target_dir="$1"
  local depth="$2"

  if [ -z "$target_dir" ]; then
    target_dir="."
  fi

  if [ -z "$depth" ]; then
    depth="-1"
  fi

  local json_output=$(get_directory_structure_json "$target_dir" "$depth" "1")

    if [[ $? -eq 0 ]]; then
      json_output='['"$json_output"']'
#        formatted_json=$json_output
      formatted_json=$(echo "$json_output" | jq .)

      echo "$formatted_json"
    else
        echo "Error in get catalog." >&2
    fi

}

if [ "$#" -gt 2 ]; then
    echo "How to use: $0 [catalog] [depth]"
    exit 1
fi

main "$@"