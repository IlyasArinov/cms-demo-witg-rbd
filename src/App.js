import React from 'react';
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import makeStyles from "@material-ui/core/styles/makeStyles";
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';


const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        backgroundColor: '#EEEEEE',
        padding: 20,
        marginBottom: 30
    },
    paper: {
        padding: theme.spacing(2),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
}));

const data = [
    {id: 1, title: 'Title 1'},
    {id: 2, title: 'Title 2'},
    {id: 3, title: 'Title 3'},
]

function App() {

    const classes = useStyles();

  return (
      <DragDropContext onDragEnd={() => {}} className={classes.root}>
          <List id={1} title="List 1" items={data} />
      </DragDropContext>
  );
}

function List({id, title, items}) {

    return (
        <div className="list" style={{border: '1px solid #eeeeee', padding: 20, width: 500}}>
            <h1>List</h1>
            <Droppable droppableId={id}>
                {provided => (
                    <div
                        className="list-content"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        {items.map(item => (
                            <ListItem key={item.id} item={item} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
function ListItem({item, index}) {

    const { id, title } = item;

    return (
        <Draggable draggableId={id} index={id}>
            {provided => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="list-item"
                    style={{padding: '24px 8px',marginBottom: 10, background: 'aliceblue'}}
                >
                    {title}{" "}
                </div>
            )}
        </Draggable>
    );
}
export default App;
