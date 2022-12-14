// import { boardService } from '../../services/board.service.local'
import { boardService } from '../../services/board.service'
import { utilService } from '../../services/util.service'
import { store } from '../store'

export const boardStore = {
    state: {
        boards: null,
        board: null,
        editedTask: null,
        previewTask: null,
        filterBy: {
            title: '',
            membersIds: [],
            isNoMembers: false,
            isAssignToMe: false,
            labelIds: [],
            isNoLabels: false
        },
        dragAndDropCounter: 0
    },

    getters: {
        boards({ boards }) { return boards },
        board({ board }) { return board },
        getEditedTask({ editedTask }) { return editedTask },
        labels({ board }) { return board.labels },
        checklists({ editedTask }) { return editedTask.checklists },
        activities({ board }) { return board.activities },
        members({ board }) { return board.members },
        getFilterBy({ filterBy }) { return filterBy },
        taskLabels({ editedTask, board }) {
            if (!editedTask.labelIds) return []
            return board.labels.filter(bl => {
                if (editedTask.labelIds.includes(bl.id))
                    return bl
            })
        },
        boardDoneTodos({ board }) {
            const boardDoneTodos = []
            if (board.groups) {
                board.groups.forEach(group => {
                    if (group.tasks) {
                        group.tasks.forEach(task => {
                            if (task.checklists) {
                                task.checklists.forEach(checklist => {
                                    if (checklist.todos) {
                                        checklist.todos.forEach(todo => {
                                            boardDoneTodos.push(todo)
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
            return boardDoneTodos
        },
        isPreviewLabelsOpen({ board }) {
            return board.isPreviewLabelsOpen
        }
        // labelIds({ editedTask }) { return editedTask.labelIds }
    },

    mutations: {
        setDragAndDropCounter(state) {
            state.dragAndDropCounter < 1 ? state.dragAndDropCounter++ : state.dragAndDropCounter = 0
        },
        setBoards(state, { boards }) {
            state.boards = boards
        },

        setBoard(state, { boardId }) {
            // console.log(boardId, '00000000000000000');
            const currBoard = state.boards.find(b => b._id === boardId)
            // console.log(currBoard)
            // console.log(currBoard);
            state.board = currBoard
            state.filterBy = {
                title: '',
                membersIds: [],
                isNoMembers: false,
                isAssignToMe: false,
                labelIds: [],
                isNoLabels: false
            }
            // console.log(state.board);
        },

        addMember(state, { member }) {
            state.board.members.unshift(member)
        },

        setPushedBoard(state, { board }) {
            // console.log('IN STORE PUSH BOARD', board);
            const boardIdx = state.boards.findIndex(b => b._id === board._id)
            state.boards.splice(boardIdx, 1, board)
            state.board = board
        },

        addBoard(state, { board }) {
            // console.log(board)
            state.boards.push(board)
        },

        updateBoard(state, { board }) {
            const idx = state.boards.findIndex(b => b._id === board._id)
            // console.log(idx);
            state.boards.splice(idx, 1, board)
        },

        removeBoard(state, { boardId }) {
            state.boards = state.boards.filter(board => board._id !== boardId)
        },

        updateTask(state, { payload }) {
            state.editedTask = payload.task
            const group = state.board.groups.find(g => g.id === payload.groupId)

            const taskIdx = group.tasks.findIndex(task => task.id === payload.task.id)
            // console.log(taskIdx);
            group.tasks.splice(taskIdx, 1, payload.task)
            // return payload.task
        },

        updateLabel(state, { label }) {
            const labelIdx = state.board.labels.findIndex(l => l.id === label.id)
            if (labelIdx === -1) state.board.labels.push(label)
            else state.board.labels.splice(labelIdx, 1, label)
        },

        setEditedTask(state, { taskId, groupId, boardId }) {
            if (!state.boards) return
            const board = state.boards.find((board) => board._id === boardId)
            const group = board.groups.find((group) => group.id === groupId)
            const task = group.tasks.find((task) => task.id === taskId)
            state.editedTask = task
        },

        addChecklist(state, { payload }) {
            const group = state.board.groups.find(g => g.id === payload.groupId)
            const taskIdx = group.tasks.findIndex(task => task.id === payload.task.id)
            if (!group.tasks[taskIdx]?.checklists) group.tasks[taskIdx].checklists = []
            payload.checklist.id = utilService.makeId()
            group.tasks[taskIdx].checklists.push(payload.checklist)
            // console.log(group.tasks[taskIdx].checklists)
        },

        addActivity(state, { activity }) {
            if (!activity) return
            activity.createdAt = Date.now()
            activity.id = utilService.makeId()
            if (!state.board?.activities) state.board.activities = []
            console.time('timer')
            if (state.board.activities.length >= 15) state.board.activities.splice(0, 1)
            console.timeEnd('timer')
            state.board.activities.push(activity)
        },

        removeActivity({ state }) {
            // state.board.activities.pop()
        },

        setFilterBy(state, { filterBy }) {
            state.filterBy = filterBy
        },

        removeBoardLabel(state, { labelId }) {
            const labelIdx = state.board.labels.findIndex(label => label.id === labelId)
            state.board.labels.splice(labelIdx, 1)
            state.board.groups.forEach(group => {
                group.tasks.forEach(task => {
                    if (task.labelIds?.includes(labelId)) {
                        const taskLabelIdx = task.labelIds.findIndex(label => label.id === labelId)
                        task.labelIds.splice(taskLabelIdx, 1)
                    }
                })
            })
        },
        // removeLastActivity(state) {
        //     state.board.activities.splice(0, 1)
        // },
        togglePreviewLabels(state, { isOpen }) {
            state.board.isPreviewLabelsOpen = isOpen
        },
        updateGroups(state, { groups }) {
            state.board.groups = groups
            return groups
        },
        updateTasks(state, { payload }) {
            const { groupId, tasks } = payload
            const group = state.board.groups.find(group => group.id === groupId)
            group.tasks = tasks
            return tasks
        },
        addTask(state, { payload }) {
            const { task, groupId } = payload
            const groupIdx = state.board.groups.findIndex((group) => group.id === groupId)
            if (!state.board.groups[groupIdx].tasks) state.board.groups[groupIdx].tasks = []
            state.board.groups[groupIdx].tasks.push(task)
        },
        copyTask(state, { payload }) {
            const { toBoard, task } = payload
            if (task.labelIds) {
                const labelsTxts = toBoard.labels.map(lbl => {
                    return lbl.txt ? lbl.txt : ''
                })
                const labelsToUpdate = state.board.labels.filter(lbl => {
                    if (task.labelIds.includes(lbl.id)) {
                        if (!labelsTxts.includes(lbl.txt)) return true
                    }
                    return false
                })
                toBoard.labels.push(...labelsToUpdate)
            }
        },
        updateBoardLabels(state, { label }) {
            // console.log(label);
            if (!label.id) {
                label.id = utilService.makeId()
                state.board.labels.push(label)
            }
            else {
                const labelIdx = state.board.labels.findIndex(lbl => lbl.id === label.id)
                state.board.labels.splice(labelIdx, 1, label)
            }
        }
    },

    actions: {
        async loadBoards(context) {
            try {
                //SEND FILTER
                const boards = await boardService.query()
                context.commit({ type: 'setBoards', boards })
                return boards
            } catch (err) {
                console.log('boardStore: Error in loadBoards', err)
                throw err
            }
        },
        async addBoard(context, { board }) {
            try {

                board = await boardService.save(board)
                context.commit({ type: 'addBoard', board })
                return board
            } catch (err) {
                console.log('boardStore: Error in addBoard', err)
                throw err
            }
        },

        async updateBoardLabels(context, { label }) {
            try {
                context.commit({ type: 'updateBoardLabels', label })
                const board = await boardService.save(context.state.board)
            }
            catch (label) {
                context.commit({ type: 'removeBoardLabel', labelId: label.id })
                console.log('couldnt add label')
                throw label
            }
        },

        async removeBoardLabel(context, { label, activity }) {
            try {
                context.commit({ type: 'removeBoardLabel', labelId: label.id })
                const board = await boardService.save(context.state.board)
            }
            catch (err) {
                context.commit({ type: 'updateBoardLabels', label })
                console.log('failed to remove label');
                throw err
            }
        },

        async updateGroups(context, { groups }) {
            const prevGroups = context.state.board.groups
            context.commit({ type: 'updateGroups', groups })
            try {
                const board = await boardService.save(context.state.board)
                context.commit({ type: 'updateBoard', board })
                context.commit({ type: 'setBoard', boardId: board._id })
                return context.state.board.groups
            }
            catch (prevGroups) {
                console.log('boardStore: Error in updateGroups')
                context.commit({ type: 'updateGroups', groups: prevGroups })
                throw prevGroups
            }
        },

        async addMember(context, { member }) {
            const prevBoard = JSON.parse(JSON.stringify(context.state.board))
            context.commit({ type: 'addMember', member })
            // newBoard.members.push(member)
            // context.commit({ type: 'updateBoard', board: newBoard })
            // context.commit({ type: 'setBoard', boardId: newBoard._id })
            try {
                const board = await boardService.save(context.state.board)
            }
            catch (err) {
                console.log('fail in add member', err);
                context.commit({ type: 'updateBoard', board: prevBoard })
            }
        },
        async removeMember(context, { memberId }) {
            const newBoard = JSON.parse(JSON.stringify(context.state.board))
            const memberIdx = newBoard.members.findIndex(member => member._id === memberId)
            if (memberIdx !== -1) newBoard.members.splice(memberIdx, 1)
            newBoard.groups.forEach(group => {
                group.tasks.forEach((task, index) => {
                    if (task.memberIds?.includes(memberId)) {
                        // console.log(task.memberIds, 'oooooooooooooooo');
                        task.memberIds.splice(index, 1)
                    }
                })
            })
            context.dispatch({ type: 'updateBoard', board: newBoard })
        },

        async updateTasks(context, { payload }) {
            // console.log(context.state.board.groups)
            // console.log(context.state.dragAndDropCounter , 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
            // console.log('PAYLOAD', payload)
            // console.log('UPDATE TASKS - store')
            var prevGroups = JSON.parse(JSON.stringify(context.state.board.groups))
            const { groupId, tasks, addedIndex } = payload
            const group = context.state.board.groups.find(group => groupId === group.id)
            var prevTasks = JSON.parse(JSON.stringify(group.tasks))
            context.commit({ type: 'updateTasks', payload })
            try {
                if (addedIndex !== null) {
                    // console.log('removerIdx:', addedIndex)
                    // console.log('task:', group.tasks[addedIndex])
                    var activity = {
                        txt: `Moved ${group.tasks[addedIndex].title}`,
                        byMember: {
                            _id: context.getters.loggedinUser._id,
                            fullname: context.getters.loggedinUser.fullname,
                            imgUrl: context.getters.loggedinUser.imgUrl || "",
                        },
                    }
                    context.commit(({ type: 'addActivity', activity }))
                }
                context.commit({ type: 'updateBoard', board: context.state.board })
                context.commit({ type: 'setBoard', boardId: context.state.board._id })
                const board = await boardService.save(context.state.board)

                // return newTasks
            }
            catch (err) {
                console.log('boardStore: Error in updateTasks')
                console.log(prevBoard)
                context.commit({ type: 'updateBoard', board: prevBoard })
                context.commit({ type: 'setBoard', boardId: prevBoard._id })
                // context.commit({ type: 'removeActivity' })
                throw prevTasks
            }
        },
        async updateBoard(context, { board }) {
            const prevBoard = context.state.board
            try {
                context.commit({ type: 'updateBoard', board })
                context.commit({ type: 'setBoard', boardId: board._id })
                const newBoard = await boardService.save(context.state.board)
                return newBoard
            } catch (err) {
                context.commit({ type: 'updateBoard', board: prevBoard })
                context.commit({ type: 'setBoard', boardId: prevBoard._id })
                console.log('boardStore: Error in updateBoard', err)
                throw err
            }
        },

        async removeBoard(context, { boardId }) {
            try {
                await boardService.remove(boardId)
                context.commit({ type: 'removeBoard', boardId })
            } catch (err) {
                console.log('boardStore: Error in removeBoard', err)
                throw err
            }
        },

        async updateTask(context, { payload }) {
            //update the task add new activity
            //and send socket to server task-updated.
            const groupId = payload.groupId
            const taskId = payload.task.id
            const prevGroup = context.state.board.groups.find(g => g.id === groupId)
            const prevTask = prevGroup.tasks.find(t => t.id === taskId)
            // context.commit({ type: 'updateTask', payload })
            if (payload.activity) context.commit({ type: 'addActivity', activity: payload.activity })
            const board = context.state.board
            try {
                const newBoard = await boardService.save(board)
                context.commit({ type: 'updateBoard', board: newBoard })
                context.commit({ type: 'setBoard', board: newBoard })
                return payload.task
            }
            catch (err) {

                console.log('boardStore: Error in updateLabels', err)
                // // context.commit({
                // //     type: 'updateTask', payload: {
                // //         task: prevTkjkljask,
                // //         groupId: payload.groupId
                // //     }
                // })
                context.commit({ type: 'removeActivity' })
                throw err

            }
        },

        async addTask(context, { boardId, groupId, task, activity }) {

            const prevBoard = JSON.parse(JSON.stringify(context.state.boards.find(board => board._id === boardId)))
            // if (!board.groups[groupIdx].tasks) board.groups[groupIdx].tasks = []
            // board.groups[groupIdx].tasks.push(task)
            try {
                context.commit({ type: 'addTask', payload: { task, groupId } })
                context.commit({ type: 'addActivity', activity })
                // console.log(context.state.board);
                const updatedBoard = await context.dispatch({ type: 'updateBoard', board: context.state.board })
                // console.log(updatedBoard);
                return updatedBoard
            } catch (err) {
                context.commit({ type: 'updateBoard', prevBoard: prevBoard })
                context.commit({ type: 'setBoard', boardId: prevBoard._id })
                context.commit({ type: 'removeActivity' })
                throw err
            }
        },

        async copyTask(context, { toBoardId, toGroupId, task, activity }) {
            const toBoard = context.state.boards.find(board => board._id === toBoardId)
            // const toGroup = toBoard.find(group => group.id === toGroupId)
            const prevBoard = JSON.parse(JSON.stringify(toBoard))
            context.commit({ type: 'copyTask', payload: { toBoard, task } })

            try {
                await context.dispatch({ type: 'addTask', boardId: toBoardId, groupId: toGroupId, task, activity })
            }
            catch (err) {
                console.log(err);
                throw err
            }
        },

        async addGroup(context, { board, group, activity }) {
            group.id = utilService.makeId()
            board.groups.push(group)
            try {
                context.commit({ type: 'addActivity', activity })
                const updatedBoard = await context.dispatch({ type: 'updateBoard', board: board })
                return updatedBoard
            }
            catch (err) {
                console.log(err);
                board.groups.pop(group)
                context.commit({ type: 'updateBoard', board })
                context.commit({ type: 'setBoard', boardId: board._id })
                context.commit({ type: 'removeActivity' })
                throw err
            }
        },

        async updateGroup(context, { group, activity }) {
            const groupIdx = context.state.board.groups.findIndex((currGroup) => currGroup.id === group.id)
            const prevGroup = context.state.board.groups[groupIdx]
            const board = JSON.parse(JSON.stringify(context.state.board))
            board.groups.splice(groupIdx, 1, group)
            try {
                context.commit({ type: 'addActivity', activity })
                const updatedBoard = await context.dispatch({ type: 'updateBoard', board: board })
                return updatedBoard
            }
            catch (err) {
                console.log(err);
                board.groups.splice(groupIdx, 1, prevGroup)
                context.commit({ type: 'updateBoard', board: board })
                context.commit({ type: 'setBoard', boardId: board._id })
                context.commit({ type: 'removeActivity' })
                throw err
            }
        },

        async removeTask(context, { payload }) {
            const prevBoard = context.state.boards.find(board => board._id === payload.activity.boardId)
            const newBoard = JSON.parse(JSON.stringify(prevBoard))
            const group = newBoard.groups.find(group => group.id === payload.activity.groupId)
            const taskIdx = group.tasks.findIndex(task => task.id === payload.taskId)
            group.tasks.splice(taskIdx, 1)
            context.commit({ type: 'updateBoard', board: newBoard })
            context.commit({ type: 'setBoard', boardId: newBoard._id })

            try {
                context.commit({ type: 'addActivity', activity: payload.activity })
                await boardService.save(newBoard)
            }
            catch (err) {
                console.log(err);
                context.commit({ type: 'updateBoard', board: prevBoard })
                context.commit({ type: 'setBoard', boardId: prevBoard._id })
                context.commit({ type: 'removeActivity' })
                throw err
            }
        },

        async removeGroup(context, { board, groupId, activity }) {
            const prevBoard = board
            const idx = board.groups.findIndex((currGroup) => currGroup.id === groupId)
            board.groups.splice(idx, 1)
            context.commit({ type: 'updateBoard', board })
            context.commit({ type: 'setBoard', boardId: board._id })

            try {
                context.commit({ type: 'addActivity', activity })
                const updatedBoard = await context.dispatch({ type: 'updateBoard', board: board })
                return updatedBoard
            }

            catch (err) {
                console.log(err);
                context.commit({ type: 'updateBoard', board: prevBoard })
                context.commit({ type: 'setBoard', boardId: prevBoard._id })
                context.commit({ type: 'removeActivity' })
                throw err
            }
        },

        async updateLabel(context, { payload }) {
            const prevLabel = context.state.board.labels.find(l => l.id === payload.label.id)

            context.commit({ type: 'updateLabel', label: payload.label })
            try {
                context.commit({ type: 'addActivity', activity: payload.activity })
                await boardService.save(context.state.board)
            } catch (err) {
                console.log('boardStore: Error in updateLabel', err)
                context.commit({ type: 'updateLabel', prevLabel })
                context.commit({ type: 'removeActivity' })
                throw err
            }
        },
    }
}