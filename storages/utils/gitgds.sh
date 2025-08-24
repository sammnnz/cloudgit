#!/usr/bin/env bash

get_directory_structure() {
  local dir="$1"
  local branch="$2"
  local depth="$3"
  local id="$4"
  local result=""

  result+='{'
  result+='"id": "'$id'",'
  if [[ "$id" == "1" ]]; then
    result+='"label": "'$(basename `pwd` | sed 's/.git$//' )'",'
  else
    result+='"label": "'$dir'",'
  fi
  result+='"fileType": "folder",'
  result+='"children": ['

  local _depth=$(echo "$id" | grep -o "\." | wc -l)
  if [[ "$dir" == "." ]]; then
      dir=""
  fi

  if [[ ! -z "$dir" ]]; then
      dir+="/"
  fi

  local _dir="$dir"
  if [[ -z "$dir" ]]; then
    _dir="."
  fi
  local items=$(git ls-tree --format='%(objecttype)  %(path)' "$branch" "$_dir" | grep "blob  " | sed "s/blob  //" | sed "s/.*\///")
  local subdirs=$(git ls-tree -z -d --format='%(path) ' "$branch" "$_dir")
  local _id="0"

  if [[ ! -z "$subdirs" ]]; then
    for subdir in $subdirs; do
      if [[ "$_depth" == "$depth" ]]; then
        break
      fi
      if [[ "$_id" != "0" ]]; then
        result+=','
      fi
      ((_id+=1))
      subdir_result=$(get_directory_structure "$dir$subdir" "$branch" "$depth" "$id"".""$_id")
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
      result+='"fileType": "file"'
      result+='},'
    done

  fi

  result=$(echo "$result" | sed 's/,$//')
  result+=']}'

  echo "$result"
}

main() {
  local branch="$1"
  local depth="$2"
  local dir="$3"
  local format="$4"
  local clear_fails="$5"

  if [ -z "$branch" ]; then
    branch="main"
  fi

  if [ -z "$depth" ]; then
    depth="-1"
  fi

  if [ -z "$dir" ]; then
    dir=""
  fi

  if [[ "$json" != "1" && "$json" != "0" ]]; then
    json="1"
  fi

  if [[ "$clear_fails" != "1" && "$clear_fails" != "0" ]]; then
    clear_fails="1"
  fi

  local json_output=$(get_directory_structure "$dir" "$branch" "$depth" "1")
  if [[ "$clear_fails" == "1" ]]; then
    clear
  fi
  if [[ $? -eq 0 ]]; then
    json_output='['"$json_output"']'
    if [[ "$json" == "1" ]]; then
      formatted_json=$(echo "$json_output" | jq .)
    else
      formatted_json=$json_output
    fi

    echo "$formatted_json"
  else
      echo "Error in get catalog." >&2
  fi

}

if [ "$#" -gt 5 ]; then
    echo "How to use: $0 [branch] [depth] [dir] [json] [clear_fails]"
    exit 1
fi

main "$@"