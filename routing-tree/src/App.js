import React, { useState, useEffect } from 'react';
import Tree from 'react-d3-tree';

// map that will be holding the entire tree
const routingTree = {
  name: '',
  children: [
  ],
};

// create a tree node
function newTreeNode(name: string, children?: RawNodeDatum[]): RawNodeDatum {
  return {
    name,
    children,
  };
}

// add tree node to routingTree
function addRoute(routingTree: RawNodeDatum, path: string): RawNodeDatum {
  // format checking
  if (!path.includes("/")) {
    throw new Error("Not of correct format");
  }

  var splittedPath = path.trim().split('/');  
  if (splittedPath.length === 0) {
    throw new Error("Not of correct format");
  }

  splittedPath = splittedPath.splice(1);

  // get the orignal routing tree
  const orignal = {routingTree};
  
  var currentNode = routingTree;
  var didAdd = false; 

  for (let i = 0; i < splittedPath.length; i++) {
    // iterate through each path element
    var pathSegment = splittedPath[i];

    // if a capture element convert it to a "*" or error case
    if (pathSegment.startsWith(":") && pathSegment.length > 1) {
      if (pathSegment.includes(":", 1)) {
        alert("Invalid path!"); // colons are placed aside from the start
        return orignal; 
      }
      pathSegment = "*";
    }
    // init array 
    if (!currentNode.children) {
      currentNode.children = [];
    }


    // find if child exists for this path
    var pathChild = null
    for (var j = 0; j < currentNode.children.length; j++) {
      if (currentNode.children[j].name === pathSegment) {
        pathChild = currentNode.children[j];
        break;
      }
    }

    // if child exists then move on to next path element
    if (pathChild) {
      currentNode = pathChild;
    } else { //else append it and then move to it
      var newNode = newTreeNode(pathSegment);
      currentNode.children.push(newNode);

      currentNode = newNode;
      didAdd = true; // appended 
    }
  }

  if (!didAdd) { // if we didn't add then the entered path was duplicated
    alert('Duplicate path: ' + path);
  } else { // else we added 
    alert('Successfully inputted path: ' + path);
  }

  return routingTree;
}

// deleting path from routingTree
function deletePath(routingTree: RawNodeDatum, path: string): RawNodeDatum {
  // format checking
  if (!path.includes("/")) {
    throw new Error("Not of correct format");
  }

  var splittedPath = path.trim().split('/');  
  if (splittedPath.length === 0) {
    throw new Error("Not of correct format");
  }

  splittedPath = splittedPath.splice(1);

  // get the orignal routing tree
  const orignal = {routingTree};

  var currentNode = routingTree;
  var didDelete = false;

  for (let i = 0; i < splittedPath.length; i++) {
    // itterate through each path element
    var pathSegment = splittedPath[i];

    // if a capture element convert it to a "*" or error case
    if (pathSegment.startsWith(":") && pathSegment.length > 1) {
      if (pathSegment.includes(":", 1)) {
        alert("Invalid path!"); // colons are placed aside from the start
        return orignal; 
      }
      pathSegment = "*";
    }

    // if you have come to the end of the tree
    if (!currentNode.children) {
      alert("Path not found!"); 
      return routingTree;
    }

    // get the index of the child we want to delete
    var existingChildIndex = -1;
    for (var j = 0; j < currentNode.children.length; j++) {
      if (currentNode.children[j].name === pathSegment) {
        existingChildIndex = j;
        break;
      }
    }

    if (existingChildIndex !== -1) {
      if (i === splittedPath.length - 1) { // if this is the element we want to delete
        currentNode.children.splice(existingChildIndex, 1);
        didDelete = true; //
      } else { // else move to this child
        currentNode = currentNode.children[existingChildIndex];
      }
    } else { // if we don't find it
      alert('Path not found: ' + path);
      return routingTree;
    }
  }

  if (didDelete) { // if we deleted 
    alert('Successfully deleted path: ' + path);
  } else {
    alert('Path not found: ' + path);
  }

  return routingTree;
}

// DFS method to add all possible results 
function dfs(node, currentPath, resultPaths:String[]) {
  var copy = []
  copy = resultPaths;
  resultPaths = copy;
  
  // append the path to the results array
  currentPath = currentPath + "/" + node.name;
  resultPaths.push(currentPath.substring(1));

  // if children exists run this with children with the added path recursively
  if (node.children) {
    for (const child of node.children) {
      dfs(child, currentPath, resultPaths);
    }
  }
}

// gets the best availble matching path
function bestPath(currentNode, newNodeName) {
  const resultPaths = [];

  dfs(currentNode, '', resultPaths);

  return findMatchingPaths(resultPaths.slice(1), newNodeName)
}

// given possible paths and user path find the ones that match following precedence rules
function findMatchingPaths(allPaths, userRoute) {
  const matchingPaths = [];
  
  // for each path in allPaths
  for (const path of allPaths) {
    // iterate through each word in path
    const pathSegments = path.split('/').splice(1);
    const userSegments = userRoute.split('/').splice(1);

    // if the lengths differ then its not a match
    if (pathSegments.length === userSegments.length) {
      var isMatch = true;

      // iterate through each word in path and user input
      for (let i = 0; i < pathSegments.length; i++) {
        // if they aren't the same and it isn't a capture element then it's not a match
        if (pathSegments[i] !== userSegments[i] && pathSegments[i] !== '*') {
          isMatch = false;
          break;
        }
      }

      // if its a match then append to potential matches
      if (isMatch) {
        matchingPaths.push(path);
      }
    }
  }
  // returning sorted and reversed (following precedence )
  return matchingPaths.sort().reverse();
}



export default function App() {
  // states for input and and routing tree
  const [rTree, setrTree] = useState(routingTree); 
  const [newNodeName, setNewNodeName] = useState('');

  // utilzing cache to store in local storage
  useEffect(() => {
    const storedTree = localStorage.getItem('routingTree');
    if (storedTree) {
      setrTree(JSON.parse(storedTree));
    }
  }, []);

  // save routingTree to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('routingTree', JSON.stringify(rTree));
  }, [rTree]);

  // add node handle
  const handleAddNode = () => {
    if (newNodeName.trim() === '') {
      alert('Node name cannot be empty');
    } else {
      setrTree((prevrTree) => {
        var newrTree = { ...prevrTree };
        try {
          var names = newNodeName.split(",");

          for (var i = 0; i < names.length; i++ ) {
            var copy = addRoute(newrTree,names[i]);
            newrTree = copy;
          }
          return newrTree;
        } catch (error) {
          alert(error);
          return newrTree;
        }
        
      });
    }
    setNewNodeName('');
  };

  // handle delete node 
  const handleDeleteNode = () => {
    if (newNodeName.trim() === '') {
      alert('Node name cannot be empty');
    } else {
      setrTree((prevrTree) => {
        var newrTree = { ...prevrTree };
        try {
          newrTree = deletePath(newrTree,newNodeName);
          return newrTree;
        } catch (error) {
          alert(error);
          return newrTree;
        }
        
      });
    }
      setNewNodeName('');
  };

  // searching handle
  const handleSearch = () => {
    if (newNodeName.trim() === '') {
      alert('Search path cannot be empty');
      return;
    }
    const best =  bestPath(rTree, newNodeName)[0];

    if (best) {
      alert('Matching path found for: ' + newNodeName + ' --> ' + best);
    } else {
      alert('No matching path found for: ' + newNodeName);
    }
  
    setNewNodeName('');
  };


  // clearing local storage and tree
  const handleResetStorage = () => {
    localStorage.removeItem('rTree');
    setrTree(routingTree);
    alert("Cleared!")
  };


  // html visual code
  return (
    <div>
      <header style={{ background: '#222', color: 'white', padding: '10px', textAlign: 'center', fontFamily: 'Roboto, sans-serif' }}>
        <h1 style={{ margin: 0 }}>COS 316 - Final Project: HTTP Routing Visualization</h1>
      </header>
  
      <div style={{ margin: '20px 0', textAlign: 'center' }}>
        <label>
          Routing Path:
          <input
            type="text"
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            style={{ marginLeft: '10px', padding: '8px', borderRadius: '5px', border: '1px solid #ddd', width: '200px' }}
         />
        </label>
          <button onClick={handleAddNode} style={{ marginLeft: '10px', padding: '8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>➕ Add Path</button>
          <button onClick={handleDeleteNode} style={{ marginLeft: '10px', padding: '8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}>➖ Delete Path</button>
          <button onClick={handleSearch} style={{ marginLeft: '10px', padding: '8px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px' }}>🔍 Search Path</button>
          <button onClick={handleResetStorage} style={{ marginLeft: '10px', padding: '8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}>🧹 Clear Tree!</button>
      </div>
  
      <div id="treeWrapper" style={{ width: '80%', height: '80vh', margin: '20px auto', border: '1px solid #ddd', borderRadius: '10px' }}>
        <Tree data={rTree} 
          collapsible={false} 
          translate={{x: (window.innerWidth*0.8)/2, y: 50}} 
          orientation="vertical" 
          rootNodeClassName="node__root"
          branchNodeClassName="node__branch"
          leafNodeClassName="node__leaf"
        />
      </div>
    </div>
  );
  
  
}
