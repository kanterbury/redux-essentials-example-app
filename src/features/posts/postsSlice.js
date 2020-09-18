import { createSlice, createAsyncThunk, createSelector, nanoid, createEntityAdapter } from '@reduxjs/toolkit';
import { client } from "../../api/client";
import { parseISO } from 'date-fns'

const postsAdapter = createEntityAdapter({
    sortComparer: (a, b) => b.date.localeCompare(a.date)
})

const initialState = postsAdapter.getInitialState({
    status: 'idle',
    error: null
})

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async() => {
    const response = await client.get('/fakeApi/posts')
    return response.posts
})

export const addNewPost = createAsyncThunk(
    'posts/addNewPost',
    // The payload creator receives the partial `{title, content, user}` object
    async initialPost => {
      const response = await client.post('/fakeApi/posts', { post: initialPost })
      return response.post
    }
  )

const postsSlice = createSlice({
    name: 'posts',
    initialState,
    reducers: {
        reactionAdded(state, action){
            const { postId, reaction } = action.payload
            const existingPost = state.entities[postId]
            if (existingPost) {
                existingPost.reactions[reaction]　+= 1
            }
        },
        postUpdated(state, action) {
            const { id,title, content } = action.payload
            const existingPost = state.entities[id]
            if(existingPost) {
                existingPost.title = title
                existingPost.content = content
            }
        }
    },
    extraReducers: {
        [addNewPost.fulfilled]: postsAdapter.addOne,
        [fetchPosts.pending]: (state, action) => {
            state.status = 'loading'
        },
        [fetchPosts.fulfilled]: (state, action) => {
            state.status = 'succeeded'
            postsAdapter.upsertMany(state, action.payload)
        },
          [fetchPosts.rejected]: (state, action) => {
            state.status = 'failed'
            state.error = action.error.message
          }
    }
});

export const { postAdded, postUpdated, reactionAdded } = postsSlice.actions;

export default postsSlice.reducer;

// Export the customized selectors for this adapter using `getSelectors`
export const {
    selectAll: selectAllPosts,
    selectById: selectPostById,
    selectIds: selectPostIds
    // Pass in a selector that returns the posts slice of state
  } = postsAdapter.getSelectors(state => state.posts)

export const selectPostsByUser = createSelector(
    [selectAllPosts, (state, userId) => userId],
    (posts, userId) => posts.filter(post => post.user === userId)
)